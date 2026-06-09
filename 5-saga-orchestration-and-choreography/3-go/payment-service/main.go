// Package main — Payment service: consumes ORDER_CREATED from saga.demo.events,
// persists a CAPTURED payment record to PostgreSQL, emits PAYMENT_CAPTURED so
// inventory-service can reserve stock. On INVENTORY_OUT_OF_STOCK it refunds and
// emits PAYMENT_REFUNDED.
package main

import (
	"context"
	"encoding/json"
	"errors"
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

// SagaEvent is the shared union event for the entire saga choreography.
type SagaEvent struct {
	Event     string  `json:"event"`
	OrderID   int64   `json:"orderId"`
	ProductID int64   `json:"productId,omitempty"`
	Quantity  int     `json:"quantity,omitempty"`
	Amount    float64 `json:"amount,omitempty"`
}

const topic = "saga.demo.events"

// ─── db helpers ──────────────────────────────────────────────────────────────

// ensureSchema creates the payments table if absent.
// orderId is UNIQUE to enforce idempotent capture.
func ensureSchema(pool *pgxpool.Pool) error {
	_, err := pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS payments (
			id         BIGSERIAL PRIMARY KEY,
			order_id   BIGINT      NOT NULL UNIQUE,
			product_id BIGINT      NOT NULL,
			quantity   INT         NOT NULL,
			status     VARCHAR(32) NOT NULL
		)
	`)
	return err
}

// ─── server ──────────────────────────────────────────────────────────────────

type server struct {
	pool     *pgxpool.Pool
	producer *kafka.Writer
}

// publish serialises a SagaEvent onto the Kafka topic.
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

// handleSagaEvent contains the payment saga logic:
//   - ORDER_CREATED  → idempotent capture → emit PAYMENT_CAPTURED
//   - INVENTORY_OUT_OF_STOCK → refund → emit PAYMENT_REFUNDED
func (s *server) handleSagaEvent(evt SagaEvent) {
	switch evt.Event {
	case "ORDER_CREATED":
		// Idempotency guard: skip if payment already captured for this order.
		var existing int64
		err := s.pool.QueryRow(context.Background(),
			`SELECT id FROM payments WHERE order_id=$1`, evt.OrderID,
		).Scan(&existing)
		if err == nil {
			// Row found — already processed.
			return
		}

		// Persist CAPTURED status before emitting PAYMENT_CAPTURED.
		_, err = s.pool.Exec(context.Background(),
			`INSERT INTO payments (order_id, product_id, quantity, status) VALUES ($1,$2,$3,'CAPTURED')`,
			evt.OrderID, evt.ProductID, evt.Quantity,
		)
		if err != nil {
			log.Printf("insert payment: %v", err)
			return
		}

		// Notify inventory to reserve stock.
		out := SagaEvent{
			Event:     "PAYMENT_CAPTURED",
			OrderID:   evt.OrderID,
			ProductID: evt.ProductID,
			Quantity:  evt.Quantity,
			Amount:    99.99,
		}
		if err := s.publish(out); err != nil {
			log.Printf("publish PAYMENT_CAPTURED: %v", err)
		}
		log.Printf("payment captured for order %d", evt.OrderID)

	case "INVENTORY_OUT_OF_STOCK":
		// Find the existing payment record and mark it REFUNDED.
		var id int64
		var status string
		err := s.pool.QueryRow(context.Background(),
			`SELECT id, status FROM payments WHERE order_id=$1`, evt.OrderID,
		).Scan(&id, &status)
		if err != nil || status == "REFUNDED" {
			return
		}
		_, err = s.pool.Exec(context.Background(),
			`UPDATE payments SET status='REFUNDED' WHERE id=$1`, id)
		if err != nil {
			log.Printf("refund payment: %v", err)
			return
		}
		// Emit PAYMENT_REFUNDED so order-service can cancel the order.
		if err := s.publish(SagaEvent{Event: "PAYMENT_REFUNDED", OrderID: evt.OrderID}); err != nil {
			log.Printf("publish PAYMENT_REFUNDED: %v", err)
		}
		log.Printf("payment refunded for order %d", evt.OrderID)
	}
}

// consumeSagaEvents runs in a goroutine and drives the payment saga steps.
func (s *server) consumeSagaEvents(brokers []string) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:     brokers,
		Topic:       topic,
		GroupID:     "payment-service-group",
		MinBytes:    1,
		MaxBytes:    1 << 20,
		// FirstOffset: a new consumer group replays from offset 0 so no saga
		// event is lost to the startup race (topic + DB wiped together on down -v).
		StartOffset: kafka.FirstOffset,
	})
	defer r.Close()

	for {
		msg, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("payment consumer read: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}
		var evt SagaEvent
		if err := json.Unmarshal(msg.Value, &evt); err != nil || evt.Event == "" {
			continue
		}
		log.Printf("payment-service consumed event %q for order %d", evt.Event, evt.OrderID)
		s.handleSagaEvent(evt)
	}
}

// ─── main ────────────────────────────────────────────────────────────────────

func main() {
	dsn := envOr("POSTGRES_DSN",
		"postgres://postgres:postgres@localhost:5432/payments?sslmode=disable")
	broker := envOr("KAFKA_BROKERS", "localhost:9092")
	port := envOr("PORT", "3002")

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

	producer := &kafka.Writer{
		Addr:                   kafka.TCP(broker),
		Topic:                  topic,
		Balancer:               &kafka.LeastBytes{},
		AllowAutoTopicCreation: true,
	}
	defer producer.Close()

	srv := &server{pool: pool, producer: producer}

	go srv.consumeSagaEvents([]string{broker})

	// Payment service exposes a minimal health endpoint; there is no public REST API.
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	addr := "0.0.0.0:" + port
	log.Printf("payment-service listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("payment-service: %v", err)
	}
}
