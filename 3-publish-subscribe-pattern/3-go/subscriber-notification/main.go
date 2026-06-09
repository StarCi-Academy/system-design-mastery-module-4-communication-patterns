// Notification Subscriber — Go (nats.go)
// Subscribes to the NATS subject "app.events" and processes each received event.
// Each subscriber process receives its OWN copy of every broadcast message (fan-out).
// Notification-specific: logs events and simulates sending email/push notifications.
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
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:4222"
	}

	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatalf("[notification] Failed to connect to NATS at %s: %v", natsURL, err)
	}
	defer nc.Close()
	fmt.Printf("[notification] Connected to NATS at %s\n", natsURL)

	// Each subscriber process Subscribe()s the SAME subject independently.
	_, err = nc.Subscribe("app.events", func(m *nats.Msg) {
		str := string(m.Data)
		var ev Event
		if err := json.Unmarshal(m.Data, &ev); err != nil {
			log.Printf("[notification] Error decoding event: %v", err)
			return
		}
		// Log the raw event string prefixed with the service name.
		fmt.Printf("notification: %s\n", str)
		// Simulate sending email/push notification for the event type.
		fmt.Printf("[notification] Sending email/push notification for event: %s\n", ev.Type)
	})
	if err != nil {
		log.Fatalf("[notification] Failed to subscribe: %v", err)
	}

	// Flush the subscription registration to the server before blocking.
	if err := nc.Flush(); err != nil {
		log.Fatalf("[notification] Failed to flush: %v", err)
	}

	fmt.Println("[notification] Subscribed to app.events — waiting for events")

	// Block until an OS signal is received (SIGINT/SIGTERM from Docker stop).
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("[notification] Shutting down")
}
