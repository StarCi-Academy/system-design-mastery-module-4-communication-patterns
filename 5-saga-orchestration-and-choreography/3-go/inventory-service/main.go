// Package main — Inventory service: consumes PAYMENT_CAPTURED from
// saga.demo.events, decrements stock in MongoDB, emits INVENTORY_OK or
// INVENTORY_OUT_OF_STOCK. Also exposes GET /stock for debugging and seeds two
// products on startup.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	kafka "github.com/segmentio/kafka-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ─── config ──────────────────────────────────────────────────────────────────

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// ensureTopic creates the saga topic (1 partition) if it does not exist yet,
// retrying until the broker accepts the request. Doing this before the consumer
// joins guarantees the topic + group coordinator are ready, which avoids a
// cold-start race where a consumer-group join can wedge against a topic that is
// still being auto-created.
func ensureTopic(brokers []string, name string) {
	for i := 0; i < 15; i++ {
		conn, err := kafka.Dial("tcp", brokers[0])
		if err != nil {
			time.Sleep(2 * time.Second)
			continue
		}
		controller, err := conn.Controller()
		if err != nil {
			_ = conn.Close()
			time.Sleep(2 * time.Second)
			continue
		}
		ctrlConn, err := kafka.Dial("tcp", controller.Host+":"+strconv.Itoa(controller.Port))
		if err != nil {
			_ = conn.Close()
			time.Sleep(2 * time.Second)
			continue
		}
		err = ctrlConn.CreateTopics(kafka.TopicConfig{
			Topic:             name,
			NumPartitions:     1,
			ReplicationFactor: 1,
		})
		_ = ctrlConn.Close()
		_ = conn.Close()
		if err == nil {
			log.Printf("ensured topic %q", name)
			return
		}
		log.Printf("ensureTopic %q (%d/15): %v", name, i+1, err)
		time.Sleep(2 * time.Second)
	}
}

// ─── domain types ────────────────────────────────────────────────────────────

// Product mirrors the TypeORM ProductEntity — id (PK, user-supplied), stock.
type Product struct {
	ID    int64 `bson:"_id"    json:"id"`
	Stock int   `bson:"stock"  json:"stock"`
}

// Fulfillment mirrors FulfillmentEntity — orderId is the idempotency key.
type Fulfillment struct {
	OrderID int64  `bson:"_id"    json:"orderId"`
	Status  string `bson:"status" json:"status"`
}

// SagaEvent is the shared union event for the entire saga choreography.
type SagaEvent struct {
	Event     string  `json:"event"`
	OrderID   int64   `json:"orderId"`
	ProductID int64   `json:"productId,omitempty"`
	Quantity  int     `json:"quantity,omitempty"`
	Amount    float64 `json:"amount,omitempty"`
}

const topic = "saga.demo.events"

// ─── server ──────────────────────────────────────────────────────────────────

type server struct {
	products     *mongo.Collection
	fulfillments *mongo.Collection
	producer     *kafka.Writer
}

// seedProducts inserts initial stock records if the products collection is empty.
// Product 1 → out-of-stock (0), Product 2 → 50 units.
func (s *server) seedProducts() error {
	ctx := context.Background()
	count, err := s.products.CountDocuments(ctx, bson.D{})
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	_, err = s.products.InsertMany(ctx, []interface{}{
		Product{ID: 1, Stock: 0},
		Product{ID: 2, Stock: 50},
	})
	return err
}

// publish serialises a SagaEvent onto the Kafka topic.
func (s *server) publish(evt SagaEvent) error {
	data, err := json.Marshal(evt)
	if err != nil {
		return err
	}
	return s.producer.WriteMessages(context.Background(), kafka.Message{
		Key:   []byte(evt.Event),
		Value: data,
	})
}

// tryFulfill implements the inventory saga step:
//  1. Idempotency: skip if orderId already fulfilled.
//  2. Load product and check stock.
//  3. If insufficient: emit INVENTORY_OUT_OF_STOCK.
//  4. If sufficient: decrement stock, record fulfillment, emit INVENTORY_OK.
func (s *server) tryFulfill(orderID, productID int64, quantity int) {
	ctx := context.Background()

	// Idempotency: if already fulfilled, do nothing.
	var existing Fulfillment
	err := s.fulfillments.FindOne(ctx, bson.M{"_id": orderID}).Decode(&existing)
	if err == nil {
		log.Printf("order %d already fulfilled, skipping", orderID)
		return
	}

	// Load product stock.
	var product Product
	err = s.products.FindOne(ctx, bson.M{"_id": productID}).Decode(&product)
	if err != nil || product.Stock < quantity {
		// Emit compensation event — inventory cannot satisfy the order.
		if err := s.publish(SagaEvent{
			Event:     "INVENTORY_OUT_OF_STOCK",
			OrderID:   orderID,
			ProductID: productID,
		}); err != nil {
			log.Printf("publish INVENTORY_OUT_OF_STOCK: %v", err)
		}
		log.Printf("out of stock for order %d (product %d, qty %d)", orderID, productID, quantity)
		return
	}

	// Decrement stock atomically via $inc.
	_, err = s.products.UpdateOne(ctx,
		bson.M{"_id": productID},
		bson.M{"$inc": bson.M{"stock": -quantity}},
	)
	if err != nil {
		log.Printf("decrement stock: %v", err)
		return
	}

	// Record fulfillment to prevent re-processing on message redelivery.
	_, err = s.fulfillments.InsertOne(ctx, Fulfillment{OrderID: orderID, Status: "DONE"})
	if err != nil {
		log.Printf("insert fulfillment: %v", err)
		// Non-fatal — stock was decremented; log and continue.
	}

	// Emit INVENTORY_OK so order-service can mark the order COMPLETED.
	if err := s.publish(SagaEvent{
		Event:     "INVENTORY_OK",
		OrderID:   orderID,
		ProductID: productID,
		Quantity:  quantity,
	}); err != nil {
		log.Printf("publish INVENTORY_OK: %v", err)
	}
	log.Printf("fulfilled order %d (product %d, qty %d)", orderID, productID, quantity)
}

// consumeSagaEvents runs in a goroutine and drives the inventory saga step.
func (s *server) consumeSagaEvents(brokers []string) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:     brokers,
		Topic:       topic,
		GroupID:     "inventory-service-group",
		MinBytes:    1,
		MaxBytes:    1 << 20,
		// FirstOffset: a new consumer group replays from offset 0 so no saga
		// event is lost to the startup race (topic + DB wiped together on down -v).
		StartOffset: kafka.FirstOffset,
	})
	defer r.Close()

	for {
		msg, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("inventory consumer read: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}
		var evt SagaEvent
		if err := json.Unmarshal(msg.Value, &evt); err != nil || evt.Event == "" {
			continue
		}
		log.Printf("inventory-service consumed event %q for order %d", evt.Event, evt.OrderID)

		// Only act on PAYMENT_CAPTURED — the trigger to reserve stock.
		if evt.Event == "PAYMENT_CAPTURED" {
			s.tryFulfill(evt.OrderID, evt.ProductID, evt.Quantity)
		}
	}
}

// ─── HTTP handlers ───────────────────────────────────────────────────────────

// listStock returns the current stock levels for all products (debug endpoint).
func (s *server) listStock(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"message":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	ctx := context.Background()
	cursor, err := s.products.Find(ctx, bson.D{})
	if err != nil {
		http.Error(w, `{"message":"db error"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var products []Product
	if err := cursor.All(ctx, &products); err != nil {
		http.Error(w, `{"message":"decode error"}`, http.StatusInternalServerError)
		return
	}
	if products == nil {
		products = []Product{}
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(products); err != nil {
		log.Printf("encode stock: %v", err)
	}
}

// ─── main ────────────────────────────────────────────────────────────────────

func main() {
	mongoURI := envOr("MONGO_URI", "mongodb://localhost:27017")
	broker := envOr("KAFKA_BROKERS", "localhost:9092")
	port := envOr("PORT", "3003")

	// Retry loop — MongoDB may not be ready immediately on container start.
	var client *mongo.Client
	for i := 0; i < 15; i++ {
		var err error
		client, err = mongo.Connect(context.Background(),
			options.Client().ApplyURI(mongoURI))
		if err == nil {
			if err = client.Ping(context.Background(), nil); err == nil {
				break
			}
		}
		log.Printf("waiting for mongodb (%d/15): %v", i+1, err)
		time.Sleep(3 * time.Second)
	}
	if client == nil {
		log.Fatal("could not connect to mongodb")
	}
	defer client.Disconnect(context.Background()) //nolint:errcheck

	db := client.Database("inventory")

	// Ensure a unique index on fulfillments._id (orderId) for idempotency.
	// The _id field is already unique in MongoDB, so this just creates the collection.
	products := db.Collection("products")
	fulfillments := db.Collection("fulfillments")

	srv := &server{
		products:     products,
		fulfillments: fulfillments,
		producer: &kafka.Writer{
			Addr:                   kafka.TCP(broker),
			Topic:                  topic,
			Balancer:               &kafka.LeastBytes{},
			AllowAutoTopicCreation: true,
		},
	}
	defer srv.producer.Close()

	// Seed initial product stock so the demo works out of the box.
	if err := srv.seedProducts(); err != nil {
		log.Printf("seed products: %v", err)
	}

	// Ensure the saga topic + its group coordinator exist before this consumer
	// joins. Three consumer groups racing to join a brand-new topic during the
	// broker's cold start can leave one group's FindCoordinator wedged; creating
	// the topic up front makes the join deterministic.
	ensureTopic([]string{broker}, topic)

	go srv.consumeSagaEvents([]string{broker})

	mux := http.NewServeMux()
	mux.HandleFunc("/stock", srv.listStock)
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	addr := "0.0.0.0:" + port
	log.Printf("inventory-service listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("inventory-service: %v", err)
	}
}
