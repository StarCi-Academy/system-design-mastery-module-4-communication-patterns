// Package main — CQRS Write Service.
// Receives POST /customer/update, upserts customer row in PostgreSQL (Write Model),
// then publishes a "customer.profile.updated" event to the RabbitMQ queue
// "cqrs.customer.profile". Mirrors the NestJS write-service contract exactly.
package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	amqp "github.com/rabbitmq/amqp091-go"
)

// queueName is the durable RabbitMQ queue shared with the read-service.
const queueName = "cqrs.customer.profile"

// CustomerEvent is the payload published to RabbitMQ and stored in PostgreSQL.
// id + name + email mirrors the TS CustomerProfileUpdatedEvent fields.
type CustomerEvent struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// app holds shared dependencies injected at startup.
type app struct {
	db      *pgxpool.Pool
	channel *amqp.Channel
}

func main() {
	ctx := context.Background()

	// ── PostgreSQL (Write Model) ──────────────────────────────────────
	pgDSN := buildPostgresDSN()
	var pool *pgxpool.Pool
	var err error
	// Retry up to 15 times with 2-second backoff so Docker can start Postgres first.
	for i := 0; i < 15; i++ {
		pool, err = pgxpool.New(ctx, pgDSN)
		if err == nil {
			if pingErr := pool.Ping(ctx); pingErr == nil {
				break
			}
			pool.Close()
		}
		log.Printf("write-service: postgres not ready, retry %d/15 ...", i+1)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("write-service: cannot connect to postgres: %v", err)
	}
	defer pool.Close()

	// Create table if not exists (equivalent to TypeORM synchronize:true).
	if _, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS customers (
			id    TEXT PRIMARY KEY,
			name  TEXT NOT NULL,
			email TEXT NOT NULL
		)
	`); err != nil {
		log.Fatalf("write-service: cannot create customers table: %v", err)
	}
	log.Println("write-service: postgres ready")

	// ── RabbitMQ publisher ────────────────────────────────────────────
	amqpURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
	var conn *amqp.Connection
	// Retry so Docker can start RabbitMQ first.
	for i := 0; i < 15; i++ {
		conn, err = amqp.Dial(amqpURL)
		if err == nil {
			break
		}
		log.Printf("write-service: rabbitmq not ready, retry %d/15 ...", i+1)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("write-service: cannot connect to rabbitmq: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("write-service: cannot open rabbitmq channel: %v", err)
	}
	defer ch.Close()

	// Declare the durable queue so messages survive a broker/consumer restart.
	if _, err := ch.QueueDeclare(queueName, true, false, false, false, nil); err != nil {
		log.Fatalf("write-service: cannot declare queue: %v", err)
	}
	log.Printf("write-service: rabbitmq publisher ready (queue=%s)", queueName)

	a := &app{db: pool, channel: ch}

	// ── HTTP routes ───────────────────────────────────────────────────
	// POST /customer/update — mirrors the TS CustomerController.update endpoint.
	http.HandleFunc("/customer/update", a.handleUpdate)

	port := getEnv("PORT", "3000")
	log.Printf("write-service: listening on :%s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("write-service: server error: %v", err)
	}
}

// handleUpdate accepts POST /customer/update with body {id, name, email},
// upserts into PostgreSQL, then publishes CustomerProfileUpdatedEvent to RabbitMQ.
func (a *app) handleUpdate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"message": "method not allowed"})
		return
	}

	var body CustomerEvent
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "invalid json"})
		return
	}
	if body.ID == "" || body.Name == "" || body.Email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "id, name, email are required"})
		return
	}

	ctx := r.Context()

	// Upsert into PostgreSQL (Write Model).
	// ON CONFLICT mirrors TypeORM save() upsert behaviour.
	_, err := a.db.Exec(ctx, `
		INSERT INTO customers (id, name, email)
		VALUES ($1, $2, $3)
		ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email
	`, body.ID, body.Name, body.Email)
	if err != nil {
		log.Printf("write-service: postgres upsert error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "db error"})
		return
	}
	log.Printf("write-service: upserted customer id=%s", body.ID)

	// Publish CustomerProfileUpdatedEvent to RabbitMQ.
	payload, err := json.Marshal(body)
	if err != nil {
		log.Printf("write-service: marshal error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "internal error"})
		return
	}

	// Persistent delivery mode so the event survives a broker restart.
	err = a.channel.PublishWithContext(ctx, "", queueName, false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         payload,
	})
	if err != nil {
		log.Printf("write-service: rabbitmq publish error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "rabbitmq error"})
		return
	}
	log.Printf("write-service: published customer.profile.updated for id=%s", body.ID)

	writeJSON(w, http.StatusOK, body)
}

// buildPostgresDSN assembles a pgx DSN from individual env vars
// matching the TS WRITE_DB_* environment variable names.
func buildPostgresDSN() string {
	host := getEnv("WRITE_DB_HOST", "localhost")
	port := getEnv("WRITE_DB_PORT", "5432")
	user := getEnv("WRITE_DB_USER", "cqrs")
	pass := getEnv("WRITE_DB_PASSWORD", "cqrs")
	name := getEnv("WRITE_DB_NAME", "cqrs_write")
	return "postgresql://" + user + ":" + pass + "@" + host + ":" + port + "/" + name
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
