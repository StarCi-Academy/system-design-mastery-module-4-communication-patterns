// Order Service — net/http producer (Go).
// Receives POST /orders, stores order in memory, publishes ORDER_CREATED to Kafka,
// then returns 201 immediately — temporal decoupling (fire-and-forget).

package main

import (
	"context"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"sync"
	"time"

	// segmentio/kafka-go: idiomatic Go Kafka client used for the Writer (producer).
	kafka "github.com/segmentio/kafka-go"
)

// Order is the domain model returned to the client.
type Order struct {
	Id          int    `json:"id"`
	ProductName string `json:"productName"`
	Quantity    int    `json:"quantity"`
	Status      string `json:"status"`
}

// CreateOrderRequest is the JSON body of POST /orders.
type CreateOrderRequest struct {
	ProductName string `json:"productName"`
	Quantity    int    `json:"quantity"`
}

// OrderEvent is the message payload published to Kafka topic order-events.
type OrderEvent struct {
	EventType   string    `json:"eventType"`
	OrderId     int       `json:"orderId"`
	ProductName string    `json:"productName"`
	Quantity    int       `json:"quantity"`
	Timestamp   time.Time `json:"timestamp"`
}

// orders is the in-memory store for demo purposes.
// Production would use a persistent database.
var orders = make(map[int]Order)

// ordersMu guards concurrent access to the orders map from parallel HTTP requests.
var ordersMu sync.Mutex

// getEnv returns the environment variable value for key, or fallback if not set.
func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func main() {
	// Read Kafka broker address from environment; fallback for local testing.
	brokerAddr := getEnv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

	// writer is created once and shared across requests.
	// kafka.Writer is safe for concurrent use.
	writer := &kafka.Writer{
		// Addr points at the Kafka broker injected via Docker Compose env.
		Addr:     kafka.TCP(brokerAddr),
		Topic:    "order-events",
		Balancer: &kafka.LeastBytes{},
		// Allow the writer to create the topic if it does not exist yet.
		// Without this, the first write may fail with "Unknown Topic" if
		// the producer starts before any consumer has triggered auto-creation.
		AllowAutoTopicCreation: true,
	}
	defer writer.Close()

	// Register both routes on the default mux.
	http.HandleFunc("/orders", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if r.Method == http.MethodPost {
			// Decode request body into CreateOrderRequest.
			var body CreateOrderRequest
			_ = json.NewDecoder(r.Body).Decode(&body)

			// Generate a random numeric order ID for demo purposes.
			rand.Seed(time.Now().UnixNano()) //nolint:staticcheck
			orderId := rand.Intn(100000-1) + 1

			// Record the order as PENDING immediately.
			order := Order{Id: orderId, ProductName: body.ProductName, Quantity: body.Quantity, Status: "PENDING"}

			ordersMu.Lock()
			orders[orderId] = order
			ordersMu.Unlock()

			// Build the event payload matching the lesson contract.
			event := OrderEvent{
				EventType:   "ORDER_CREATED",
				OrderId:     orderId,
				ProductName: body.ProductName,
				Quantity:    body.Quantity,
				// UTC timestamp for correlation in logs across services.
				Timestamp: time.Now().UTC(),
			}

			// Fire-and-forget publish to topic order-events; do not wait for consumers.
			// WriteMessages returns after the broker has accepted the batch, not after
			// any consumer has processed it — this is temporal decoupling.
			bytes, err := json.Marshal(event)
			if err == nil {
				if werr := writer.WriteMessages(context.Background(), kafka.Message{Value: bytes}); werr != nil {
					log.Printf("Error publishing event: %v", werr)
				}
			}

			// Return 201 Created immediately — consumer processing is fully decoupled.
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(order)
			return
		}

		if r.Method == http.MethodGet {
			// Return all in-memory orders as a JSON array.
			ordersMu.Lock()
			list := make([]Order, 0, len(orders))
			for _, o := range orders {
				list = append(list, o)
			}
			ordersMu.Unlock()

			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(list)
			return
		}

		// Any other method is not allowed.
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	})

	log.Println("Go Order Service listening on :3001")
	// Bind to all interfaces so Docker can forward traffic from the host.
	_ = http.ListenAndServe(":3001", nil)
}
