// Analytics Subscriber — Go (nats.go)
// Subscribes to the NATS subject "app.events" and processes each received event.
// Each subscriber process receives its OWN copy of every broadcast message (fan-out).
// Analytics-specific: logs events and simulates updating metrics.
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/nats-io/nats.go"
)

// Event represents the envelope received from the publisher on app.events.
type Event struct {
	// Type is the event type string, e.g. "USER_REGISTERED".
	Type string `json:"type"`
	// Payload is the arbitrary value attached to the event.
	Payload interface{} `json:"payload"`
	// Timestamp is the UTC moment the publisher emitted the event.
	Timestamp string `json:"timestamp"`
}

func main() {
	// Read NATS URL from environment variable (injected by Docker Compose).
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:4222"
	}

	// Open the NATS connection — points at the same broker as the publisher.
	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatalf("[analytics] Failed to connect to NATS at %s: %v", natsURL, err)
	}
	defer nc.Close()
	fmt.Printf("[analytics] Connected to NATS at %s\n", natsURL)

	// Each subscriber process Subscribe()s the SAME subject independently.
	// NATS core pub/sub delivers a copy to EACH subscriber on the subject (fan-out).
	_, err = nc.Subscribe("app.events", func(m *nats.Msg) {
		str := string(m.Data)
		var ev Event
		if err := json.Unmarshal(m.Data, &ev); err != nil {
			log.Printf("[analytics] Error decoding event: %v", err)
			return
		}
		// Log the raw event string prefixed with the service name.
		fmt.Printf("analytics: %s\n", str)
		// Simulate updating analytics metrics for the event type.
		fmt.Printf("[analytics] Updating metrics for event type: %s\n", ev.Type)
	})
	if err != nil {
		log.Fatalf("[analytics] Failed to subscribe: %v", err)
	}

	// Flush the subscription registration to the server before blocking.
	if err := nc.Flush(); err != nil {
		log.Fatalf("[analytics] Failed to flush: %v", err)
	}

	fmt.Println("[analytics] Subscribed to app.events — waiting for events")

	// Block until an OS signal is received (SIGINT/SIGTERM from Docker stop).
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("[analytics] Shutting down")
}
