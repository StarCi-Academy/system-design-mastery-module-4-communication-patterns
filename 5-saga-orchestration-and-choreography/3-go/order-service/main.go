// Package main — Order service: REST POST /order persists to PostgreSQL,
// emits ORDER_CREATED on saga.demo.events, consumes saga events to
// transition order status (COMPLETED / CANCELLED).
package main

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	kafka "github.com/segmentio/kafka-go"
)

// ─── config ──────────────────────────────────────────────────────────────────

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// ─── domain types ────────────────────────────────────────────────────────────

// Order mirrors the TypeORM OrderEntity columns.
type Order struct {
	ID        int64  `json:"id"`
	ProductID int64  `json:"productId"`
	Quantity  int    `json:"quantity"`
	Status    string `json:"status"`
}

// SagaEvent is the union type shared across all three saga services.
type SagaEvent struct {
	Event     string  `json:"event"`
	OrderID   int64   `json:"orderId"`
	ProductID int64   `json:"productId,omitempty"`
	Quantity  int     `json:"quantity,omitempty"`
	Amount    float64 `json:"amount,omitempty"`
}

const topic = "saga.demo.events"

// ─── db helpers ──────────────────────────────────────────────────────────────

// ensureSchema creates the orders table if it does not yet exist.
// Using synchronize-by-DDL avoids a separate migration file while keeping
// the table shape identical to the TypeORM entity.
func ensureSchema(pool *pgxpool.Pool) error {
	_, err := pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS orders (
			id         BIGSERIAL PRIMARY KEY,
			product_id BIGINT      NOT NULL,
			quantity   INT         NOT NULL,
			status     VARCHAR(32) NOT NULL DEFAULT 'PENDING'
		)
	`)
	return err
}

// ─── handlers ────────────────────────────────────────────────────────────────

type server struct {
	pool     *pgxpool.Pool
	producer *kafka.Writer
}

// createOrder persists a PENDING order then emits ORDER_CREATED.
// POST /order  body: {"productId":1,"quantity":2}
func (s *server) createOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"message":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"message":"read error"}`, http.StatusBadRequest)
		return
	}
	var input struct {
		ProductID int64 `json:"productId"`
		Quantity  int   `json:"quantity"`
	}
	if err := json.Unmarshal(body, &input); err != nil || input.ProductID == 0 || input.Quantity == 0 {
		http.Error(w, `{"message":"invalid body"}`, http.StatusBadRequest)
		return
	}

	// Persist order with PENDING status before emitting event.
	var id int64
	err = s.pool.QueryRow(context.Background(),
		`INSERT INTO orders (product_id, quantity, status) VALUES ($1, $2, 'PENDING') RETURNING id`,
		input.ProductID, input.Quantity,
	).Scan(&id)
	if err != nil {
		log.Printf("insert order: %v", err)
		http.Error(w, `{"message":"db error"}`, http.StatusInternalServerError)
		return
	}

	// Emit ORDER_CREATED so payment-service can start the saga chain.
	evt := SagaEvent{
		Event:     "ORDER_CREATED",
		OrderID:   id,
		ProductID: input.ProductID,
		Quantity:  input.Quantity,
	}
	if err := s.publish(evt); err != nil {
		log.Printf("publish ORDER_CREATED: %v", err)
	}

	order := Order{ID: id, ProductID: input.ProductID, Quantity: input.Quantity, Status: "PENDING"}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(order); err != nil {
		log.Printf("encode response: %v", err)
	}
}

// publish serialises a SagaEvent and writes it to the Kafka topic.
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

// ─── saga consumer ───────────────────────────────────────────────────────────

// consumeSagaEvents runs in a goroutine and transitions order status based on
// INVENTORY_OK (→ COMPLETED) or INVENTORY_OUT_OF_STOCK / PAYMENT_REFUNDED (→ CANCELLED).
func (s *server) consumeSagaEvents(brokers []string) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  "order-service-group",
		MinBytes: 1,
		MaxBytes: 1 << 20,
		// Start from the earliest offset for a brand-new consumer group so the
		// service never misses saga events produced during the startup race
		// (the topic + Postgres are wiped together via `docker compose down -v`,
		// so replaying from offset 0 is deterministic for the lab).
		StartOffset: kafka.FirstOffset,
	})
	defer r.Close()

	for {
		msg, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("order consumer read: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}

		var evt SagaEvent
		if err := json.Unmarshal(msg.Value, &evt); err != nil || evt.Event == "" {
			continue
		}
		log.Printf("order-service consumed event %q for order %d", evt.Event, evt.OrderID)

		switch evt.Event {
		case "INVENTORY_OK":
			// Stock was reserved — mark order completed.
			s.updateStatus(evt.OrderID, "COMPLETED")
		case "INVENTORY_OUT_OF_STOCK", "PAYMENT_REFUNDED":
			// Compensation triggered — cancel the order.
			s.updateStatus(evt.OrderID, "CANCELLED")
		}
	}
}

// updateStatus applies the status transition in PostgreSQL.
func (s *server) updateStatus(orderID int64, status string) {
	_, err := s.pool.Exec(context.Background(),
		`UPDATE orders SET status=$1 WHERE id=$2`, status, orderID)
	if err != nil {
		log.Printf("updateStatus %q order %d: %v", status, orderID, err)
	}
}

// ─── main ────────────────────────────────────────────────────────────────────

func main() {
	dsn := envOr("POSTGRES_DSN",
		"postgres://postgres:postgres@localhost:5432/orders?sslmode=disable")
	broker := envOr("KAFKA_BROKERS", "localhost:9092")
	port := envOr("PORT", "3001")

	// Retry loop — Postgres may not be ready immediately on container start.
	var pool *pgxpool.Pool
	for i := 0; i < 15; i++ {
		var err error
		pool, err = pgxpool.New(context.Background(), dsn)
		if err == nil {
			if err = pool.Ping(context.Background()); err == nil {
				break
			}
		}
		log.Printf("waiting for postgres (%d/15): %v", i+1, err)
		time.Sleep(3 * time.Second)
	}
	if pool == nil {
		log.Fatal("could not connect to postgres")
	}

	if err := ensureSchema(pool); err != nil {
		log.Fatalf("ensureSchema: %v", err)
	}

	// Producer — async writes, no required acks for simplicity (lesson demo).
	producer := &kafka.Writer{
		Addr:                   kafka.TCP(broker),
		Topic:                  topic,
		Balancer:               &kafka.LeastBytes{},
		AllowAutoTopicCreation: true,
	}
	defer producer.Close()

	srv := &server{pool: pool, producer: producer}

	// Consume saga events in background to update order status.
	go srv.consumeSagaEvents([]string{broker})

	mux := http.NewServeMux()
	mux.HandleFunc("/order", srv.createOrder)

	addr := "0.0.0.0:" + port
	log.Printf("order-service listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("order-service: %v", err)
	}
}
