// Inventory Service — Kafka consumer (Go).
// Subscribes to topic order-events as consumer group inventory-consumer.
// On ORDER_CREATED events, logs a stock decrement to demonstrate fan-out and temporal decoupling.

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	// segmentio/kafka-go: idiomatic Go Kafka client used for the Reader (consumer).
	kafka "github.com/segmentio/kafka-go"
)

// OrderEvent mirrors the payload published by the order-service.
type OrderEvent struct {
	EventType   string    `json:"eventType"`
	OrderId     int       `json:"orderId"`
	ProductName string    `json:"productName"`
	Quantity    int       `json:"quantity"`
	Timestamp   time.Time `json:"timestamp"`
}

// getEnv returns the environment variable value for key, or fallback if not set.
func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func main() {
	// Read Kafka broker address from env; Docker Compose injects KAFKA_BOOTSTRAP_SERVERS.
	brokerAddr := getEnv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

	// reader opens the connection to Kafka with group inventory-consumer.
	// GroupID "inventory-consumer" is distinct from "notification-consumer":
	// Kafka maintains a separate offset per group, so each group gets its own
	// full copy of every event — this is broadcast / fan-out semantics.
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{brokerAddr},
		// Distinct group: this consumer gets its own copy of every event.
		GroupID:  "inventory-consumer",
		Topic:    "order-events",
		MinBytes: 1,   // fetch a message as soon as one byte is available (low-latency demo)
		MaxBytes: 10e6, // 10 MB maximum fetch size
	})
	defer reader.Close()

	log.Println("Inventory consumer started, waiting for order-events...")

	// Consume in an infinite loop; kafka-go handles reconnection automatically.
	for {
		// ReadMessage blocks until a message is available.
		// On restart, the reader resumes from the last committed offset for
		// group inventory-consumer, replaying any events missed while down
		// (at-least-once delivery — demonstrated in Flow 4).
		m, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break
		}

		// Unmarshal the JSON event payload.
		var event OrderEvent
		if err := json.Unmarshal(m.Value, &event); err != nil {
			log.Printf("Error parsing message: %v", err)
			continue
		}

		if event.EventType == "ORDER_CREATED" {
			// Log format matches the expected body §2.1.5 output exactly.
			fmt.Printf("inventory-service  | Received ORDER_CREATED: order %d (%s x%d)\n",
				event.OrderId, event.ProductName, event.Quantity)
			// Simulate decrementing stock — a real service would update a DB here.
			fmt.Printf("inventory-service  | Decrementing stock for \"%s\" by %d...\n",
				event.ProductName, event.Quantity)
		}
	}
}
