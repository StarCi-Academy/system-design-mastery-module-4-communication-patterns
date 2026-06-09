// Notification Service — Kafka consumer (Go).
// Subscribes to topic order-events as consumer group notification-consumer.
// A DIFFERENT group from inventory-consumer: same event is delivered here too (broadcast).
// On ORDER_CREATED events, logs a notification send to demonstrate fan-out semantics.

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

	// reader opens the connection to Kafka with group notification-consumer.
	// GroupID "notification-consumer" is different from "inventory-consumer":
	// Kafka delivers a full independent copy of every event to each group —
	// both services see the same ORDER_CREATED event (broadcast / fan-out).
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{brokerAddr},
		// A different group from inventory: same event is delivered here too (broadcast).
		GroupID:  "notification-consumer",
		Topic:    "order-events",
		MinBytes: 1,   // fetch a message as soon as one byte is available (low-latency demo)
		MaxBytes: 10e6,
	})
	defer reader.Close()

	log.Println("Notification consumer started, waiting for order-events...")

	// Consume in an infinite loop; kafka-go handles reconnection automatically.
	for {
		// ReadMessage blocks until a message is available.
		// On restart, the reader resumes from the last committed offset for
		// group notification-consumer — at-least-once delivery guaranteed.
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
			fmt.Printf("notification-service | Received ORDER_CREATED: order %d (%s x%d)\n",
				event.OrderId, event.ProductName, event.Quantity)
			// Simulate sending a notification — a real service would call email/SMS here.
			fmt.Printf("notification-service | Sending notification for order %d...\n",
				event.OrderId)
		}
	}
}
