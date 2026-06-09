// Publisher Service — Go (net/http + nats.go)
// Accepts POST /events, wraps {type, payload} into an event envelope with a timestamp,
// and publishes it on the NATS subject "app.events" fire-and-forget.
// The publisher never knows which or how many subscribers are listening (decoupling).
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/nats-io/nats.go"
)

// EventRequest represents the JSON body of POST /events.
type EventRequest struct {
	// Type is the event type string, e.g. "USER_REGISTERED".
	Type string `json:"type"`
	// Payload is any JSON value attached to the event.
	Payload interface{} `json:"payload"`
}

// Event is the envelope published to the NATS subject.
type Event struct {
	// Type is the event type string copied from the request.
	Type string `json:"type"`
	// Payload is the arbitrary value from the request.
	Payload interface{} `json:"payload"`
	// Timestamp is the server-side UTC moment of publish in RFC3339Nano format.
	Timestamp string `json:"timestamp"`
}

// EventResponse is the HTTP 201 response body returned to the caller.
type EventResponse struct {
	// Status is always "published" on success.
	Status string `json:"status"`
	// Subject is the NATS subject the event was published on.
	Subject string `json:"subject"`
	// Event is the envelope that was published.
	Event Event `json:"event"`
}

func main() {
	// Read NATS URL from environment variable (injected by Docker Compose).
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:4222"
	}

	// Open one NATS connection shared for all requests.
	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatalf("[publisher] Failed to connect to NATS at %s: %v", natsURL, err)
	}
	defer nc.Close()
	fmt.Printf("[publisher] Connected to NATS at %s\n", natsURL)

	// POST /events — accept an event body, publish to app.events, return HTTP 201.
	http.HandleFunc("/events", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Reject non-POST methods.
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			_ = json.NewEncoder(w).Encode(map[string]string{"message": "method not allowed"})
			return
		}

		// Decode the request body into EventRequest.
		var body EventRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"message": "invalid body"})
			return
		}

		// Build the event envelope — timestamp is stamped at the publisher.
		event := Event{
			Type:      body.Type,
			Payload:   body.Payload,
			Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		}

		bytes, err := json.Marshal(event)
		if err == nil {
			// Fire-and-forget: Publish returns immediately, no per-subscriber ack.
			_ = nc.Publish("app.events", bytes)
			fmt.Printf("[publisher] Published event type=%s to app.events\n", event.Type)
		}

		// Return HTTP 201 with the published envelope.
		resp := EventResponse{Status: "published", Subject: "app.events", Event: event}
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(resp)
	})

	// Bind on all interfaces so Docker can expose the port.
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}
	fmt.Printf("[publisher] Listening on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
