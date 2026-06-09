// Package main — CQRS Read Service.
// Consumes "customer.profile.updated" events from the RabbitMQ queue
// "cqrs.customer.profile", projects customer documents into Elasticsearch
// (Read Model), and serves GET /customer/:id queries from Elasticsearch.
// Mirrors the NestJS read-service contract exactly.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
	amqp "github.com/rabbitmq/amqp091-go"
)

// queueName is the durable RabbitMQ queue shared with the write-service.
const queueName = "cqrs.customer.profile"

// indexName is the Elasticsearch read-model index.
const indexName = "customers"

// CustomerDoc is both the event payload and the Elasticsearch document shape.
// Mirrors the TS { id, name, email } payload on the customer.profile.updated event.
type CustomerDoc struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// app holds shared dependencies injected at startup.
type app struct {
	es *elasticsearch.Client
}

func main() {
	ctx := context.Background()

	// ── Elasticsearch (Read Model) ────────────────────────────────────
	esNode := getEnv("ELASTICSEARCH_NODE", "http://localhost:9200")
	es, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{esNode},
	})
	if err != nil {
		log.Fatalf("read-service: cannot create elasticsearch client: %v", err)
	}

	// Wait for ES to be reachable, then create the index (ignore 400 "already exists").
	a := &app{es: es}
	if err := a.initIndex(ctx); err != nil {
		log.Fatalf("read-service: cannot initialize elasticsearch index: %v", err)
	}
	log.Println("read-service: elasticsearch ready")

	// ── RabbitMQ consumer (background goroutine) ──────────────────────
	amqpURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
	go a.runConsumer(ctx, amqpURL)

	// ── HTTP routes ───────────────────────────────────────────────────
	// GET /customer/:id — mirrors the TS CustomerController.get endpoint.
	http.HandleFunc("/customer/", a.handleGetCustomer)

	port := getEnv("PORT", "3001")
	log.Printf("read-service: listening on :%s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("read-service: server error: %v", err)
	}
}

// initIndex creates the "customers" index with keyword/text mappings.
// Retries until Elasticsearch is reachable; ignores 400 (index already exists).
func (a *app) initIndex(ctx context.Context) error {
	mapping := `{
		"mappings": {
			"properties": {
				"id":    { "type": "keyword" },
				"name":  { "type": "text" },
				"email": { "type": "keyword" }
			}
		}
	}`

	var lastErr error
	for i := 0; i < 30; i++ {
		res, err := a.es.Indices.Create(
			indexName,
			a.es.Indices.Create.WithBody(strings.NewReader(mapping)),
			a.es.Indices.Create.WithContext(ctx),
		)
		if err != nil {
			lastErr = err
			log.Printf("read-service: elasticsearch not ready, retry %d/30 ...", i+1)
			time.Sleep(2 * time.Second)
			continue
		}
		status := res.StatusCode
		_ = res.Body.Close()
		// 200 created; 400 already-exists — both are fine.
		if status < 300 || status == http.StatusBadRequest {
			return nil
		}
		lastErr = fmt.Errorf("unexpected status %d creating index", status)
		log.Printf("read-service: elasticsearch index create returned %d, retry %d/30 ...", status, i+1)
		time.Sleep(2 * time.Second)
	}
	return lastErr
}

// runConsumer reads "customer.profile.updated" events from RabbitMQ and projects
// them into Elasticsearch. Go equivalent of the NestJS @EventPattern handler with
// manual ack: ack only after a successful upsert, nack+requeue on failure.
func (a *app) runConsumer(ctx context.Context, amqpURL string) {
	var conn *amqp.Connection
	var err error
	for i := 0; i < 15; i++ {
		conn, err = amqp.Dial(amqpURL)
		if err == nil {
			break
		}
		log.Printf("read-service: rabbitmq not ready, retry %d/15 ...", i+1)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("read-service: cannot connect to rabbitmq: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("read-service: cannot open rabbitmq channel: %v", err)
	}
	defer ch.Close()

	// Declare the same durable queue so it exists regardless of start order.
	if _, err := ch.QueueDeclare(queueName, true, false, false, false, nil); err != nil {
		log.Fatalf("read-service: cannot declare queue: %v", err)
	}
	// prefetch=1 — one unacked message at a time, mirroring the NestJS consumer.
	if err := ch.Qos(1, 0, false); err != nil {
		log.Fatalf("read-service: cannot set qos: %v", err)
	}

	// autoAck=false — we ack manually after the projection succeeds.
	deliveries, err := ch.Consume(queueName, "", false, false, false, false, nil)
	if err != nil {
		log.Fatalf("read-service: cannot start consumer: %v", err)
	}
	log.Printf("read-service: rabbitmq consumer ready (queue=%s)", queueName)

	for msg := range deliveries {
		var doc CustomerDoc
		if err := json.Unmarshal(msg.Body, &doc); err != nil {
			log.Printf("read-service: unmarshal error: %v", err)
			// Bad payload — drop it (no requeue) to avoid a poison-message loop.
			_ = msg.Nack(false, false)
			continue
		}

		log.Printf("read-service: received customer.profile.updated for id=%s", doc.ID)

		if err := a.upsertCustomer(ctx, doc); err != nil {
			log.Printf("read-service: elasticsearch upsert error: %v", err)
			// Transient failure — requeue for retry, mirroring NestJS throw → no ack.
			_ = msg.Nack(false, true)
			continue
		}

		// Ack only after a successful projection.
		_ = msg.Ack(false)
		log.Printf("read-service: projected customer id=%s into read model", doc.ID)
	}
}

// upsertCustomer indexes a document under its id (idempotent), refreshing so it is
// immediately queryable — equivalent to the TS ES client.index({ refresh: true }).
func (a *app) upsertCustomer(ctx context.Context, doc CustomerDoc) error {
	payload, err := json.Marshal(doc)
	if err != nil {
		return err
	}
	res, err := a.es.Index(
		indexName,
		bytes.NewReader(payload),
		a.es.Index.WithDocumentID(doc.ID),
		a.es.Index.WithRefresh("true"),
		a.es.Index.WithContext(ctx),
	)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.IsError() {
		body, _ := io.ReadAll(res.Body)
		return fmt.Errorf("elasticsearch index error: %s", string(body))
	}
	return nil
}

// handleGetCustomer serves GET /customer/{id}.
// Mirrors the TS CustomerController.get: 404 if not found, 200 with doc if found.
func (a *app) handleGetCustomer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"message": "method not allowed"})
		return
	}

	// Extract {id} from /customer/{id}.
	id := strings.TrimPrefix(r.URL.Path, "/customer/")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "id is required"})
		return
	}

	ctx := r.Context()
	res, err := a.es.Get(indexName, id, a.es.Get.WithContext(ctx))
	if err != nil {
		log.Printf("read-service: elasticsearch get error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "db error"})
		return
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusNotFound {
		writeJSON(w, http.StatusNotFound, map[string]string{"message": "not found"})
		return
	}
	if res.IsError() {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "db error"})
		return
	}

	// Unwrap the _source field from the ES get response.
	var envelope struct {
		Source CustomerDoc `json:"_source"`
	}
	if err := json.NewDecoder(res.Body).Decode(&envelope); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "decode error"})
		return
	}

	writeJSON(w, http.StatusOK, envelope.Source)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("writeJSON encode error: %v", err)
	}
}
