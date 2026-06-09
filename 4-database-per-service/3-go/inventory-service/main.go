// Package main — Inventory microservice: REST API backed by MongoDB, plus a Kafka
// consumer that listens to "order-events" and decrements product stock.
//
// Endpoints:
//
//	POST /inventory  — create a product with initial stock
//
// Kafka consumer (group "inventory-group", topic "order-events"):
//
//	On every ORDER_CREATED message: if productName + quantity present,
//	find the product by name and decrement stock (no-op when stock insufficient).
//
// Environment variables:
//
//	PORT                HTTP port (default 3002)
//	INVENTORY_MONGO_URI MongoDB connection URI (default mongodb://localhost:27017/inventory_db)
//	KAFKA_BROKERS       comma-separated broker list (default kafka:9092)
package main

import (
	"context"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Product mirrors the Mongoose Product schema — collection "products".
type Product struct {
	ID    primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Name  string             `bson:"name"          json:"name"`
	Stock int                `bson:"stock"         json:"stock"`
}

// createProductInput is the request body for POST /inventory.
type createProductInput struct {
	Name  string `json:"name"`
	Stock int    `json:"stock"`
}

// OrderEventPayload is the Kafka message payload from order-service.
type OrderEventPayload struct {
	OrderID     int64   `json:"orderId"`
	CustomerID  string  `json:"customerId"`
	TotalAmount string  `json:"totalAmount"`
	ProductName *string `json:"productName"`
	Quantity    *int    `json:"quantity"`
}

// app holds shared dependencies.
type app struct {
	products *mongo.Collection
}

func main() {
	port := envOrDefault("PORT", "3002")
	mongoURI := envOrDefault("INVENTORY_MONGO_URI", "mongodb://localhost:27017/inventory_db")
	brokerList := envOrDefault("KAFKA_BROKERS", "kafka:9092")

	// Retry Mongo connection — service may start before DB is ready.
	var client *mongo.Client
	for i := 0; i < 10; i++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		c, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
		cancel()
		if err == nil {
			pingCtx, pingCancel := context.WithTimeout(context.Background(), 3*time.Second)
			pingErr := c.Ping(pingCtx, nil)
			pingCancel()
			if pingErr == nil {
				client = c
				break
			}
		}
		log.Printf("waiting for mongodb (%d/10)...", i+1)
		time.Sleep(3 * time.Second)
	}
	if client == nil {
		log.Fatal("could not connect to mongodb")
	}
	defer func() {
		_ = client.Disconnect(context.Background())
	}()

	db := client.Database("inventory_db")
	products := db.Collection("products")

	// Retry Kafka TCP connectivity before creating the reader.
	brokers := strings.Split(brokerList, ",")
	for i := 0; i < 15; i++ {
		conn, err := net.DialTimeout("tcp", brokers[0], 2*time.Second)
		if err == nil {
			conn.Close()
			break
		}
		log.Printf("waiting for kafka (%d/15)...", i+1)
		time.Sleep(3 * time.Second)
	}

	// TCP being reachable does not mean the KRaft group coordinator is ready.
	// Give the broker a short settle window so the very first consumer-group
	// JoinGroup succeeds on a cold `docker compose up` instead of stalling.
	time.Sleep(8 * time.Second)

	// Start Kafka consumer in background goroutine.
	go consumeOrderEvents(brokers, products)

	a := &app{products: products}

	mux := http.NewServeMux()
	mux.HandleFunc("/inventory", a.handleInventory)

	addr := "0.0.0.0:" + port
	log.Printf("inventory-service listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("inventory-service failed: %v", err)
	}
}

// handleInventory dispatches POST (create product) — other methods return 405.
func (a *app) handleInventory(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		writeJSON(w, map[string]string{"message": "method not allowed"})
		return
	}
	a.createProduct(w, r)
}

// createProduct inserts a new product document into the "products" collection.
func (a *app) createProduct(w http.ResponseWriter, r *http.Request) {
	var input createProductInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		writeJSON(w, map[string]string{"message": "invalid json"})
		return
	}
	if input.Name == "" {
		w.WriteHeader(http.StatusBadRequest)
		writeJSON(w, map[string]string{"message": "name is required"})
		return
	}

	doc := Product{
		ID:    primitive.NewObjectID(),
		Name:  input.Name,
		Stock: input.Stock,
	}
	if _, err := a.products.InsertOne(r.Context(), doc); err != nil {
		log.Printf("mongo insert error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		writeJSON(w, map[string]string{"message": "internal server error"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, doc)
}

// newReader builds the consumer-group Reader for topic "order-events".
func newReader(brokers []string) *kafka.Reader {
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers:     brokers,
		Topic:       "order-events",
		GroupID:     "inventory-group",
		MinBytes:    1,    // deliver each event immediately (no batch wait)
		MaxBytes:    10e6, // 10 MB
		StartOffset: kafka.FirstOffset,
		// Short, explicit group-coordination timeouts so the very first
		// JoinGroup/SyncGroup settles quickly on a freshly started broker.
		HeartbeatInterval: 1 * time.Second,
		SessionTimeout:    6 * time.Second,
		RebalanceTimeout:  6 * time.Second,
		MaxWait:           500 * time.Millisecond,
		ErrorLogger:       kafka.LoggerFunc(log.Printf),
	})
}

// consumeOrderEvents is a blocking loop — runs in a goroutine.
// It reads from "order-events" topic and decrements product stock.
//
// On a cold `docker compose up`, the KRaft broker may answer with
// "Group Coordinator Not Available" until the internal __consumer_offsets
// topic is created. segmentio/kafka-go does not always recover from that
// first-join failure, so we wrap ReadMessage in a per-attempt timeout and
// recreate the Reader until the first message is read successfully.
func consumeOrderEvents(brokers []string, products *mongo.Collection) {
	r := newReader(brokers)
	log.Println("inventory-service: kafka consumer started on topic 'order-events'")

	joined := false
	for {
		// Until the first successful read, bound each attempt so a stalled
		// coordinator handshake forces a fresh Reader (and a fresh
		// FindCoordinator that eventually creates __consumer_offsets).
		ctx := context.Background()
		var cancel context.CancelFunc
		if !joined {
			ctx, cancel = context.WithTimeout(context.Background(), 10*time.Second)
		}

		msg, err := r.ReadMessage(ctx)
		if cancel != nil {
			cancel()
		}
		if err != nil {
			log.Printf("kafka read error: %v", err)
			if !joined {
				// Recreate the Reader to retry the coordinator handshake.
				_ = r.Close()
				time.Sleep(2 * time.Second)
				r = newReader(brokers)
			} else {
				time.Sleep(time.Second)
			}
			continue
		}
		joined = true

		var payload OrderEventPayload
		if err := json.Unmarshal(msg.Value, &payload); err != nil {
			log.Printf("unmarshal error: %v", err)
			continue
		}

		log.Printf("received order-events: %s", string(msg.Value))

		// Only decrement when productName and a positive quantity are provided —
		// mirrors the TS guard: typeof productName === "string" && quantity > 0.
		if payload.ProductName == nil || payload.Quantity == nil || *payload.Quantity <= 0 {
			continue
		}

		if err := decrementStock(products, *payload.ProductName, *payload.Quantity); err != nil {
			log.Printf("decrementStock error: %v", err)
		}
	}
}

// decrementStock finds the product by name and decrements stock if sufficient.
// No-ops (returns nil) when product not found or stock insufficient — mirrors TS return null.
func decrementStock(products *mongo.Collection, name string, quantity int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var doc Product
	if err := products.FindOne(ctx, bson.M{"name": name}).Decode(&doc); err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("product %q not found, skipping decrement", name)
			return nil
		}
		return err
	}

	if doc.Stock < quantity {
		log.Printf("insufficient stock for %q: have %d, need %d", name, doc.Stock, quantity)
		return nil
	}

	log.Printf("decrementing stock for %q by %d", name, quantity)
	_, err := products.UpdateOne(
		ctx,
		bson.M{"_id": doc.ID},
		bson.M{"$inc": bson.M{"stock": -quantity}},
	)
	return err
}

// writeJSON marshals v as JSON to w; logs any encode error.
func writeJSON(w http.ResponseWriter, v any) {
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("json encode error: %v", err)
	}
}

// envOrDefault returns the env var value or fallback.
func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
