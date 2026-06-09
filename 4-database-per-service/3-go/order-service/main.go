// Package main — Order microservice: REST API that persists orders to PostgreSQL
// and emits ORDER_CREATED events to Kafka topic "order-events".
//
// Endpoints:
//
//	POST /orders  — create order, persist to Postgres, emit Kafka event
//
// Environment variables:
//
//	PORT              HTTP port (default 3001)
//	ORDER_DB_HOST     Postgres host
//	ORDER_DB_PORT     Postgres port (default 5432)
//	ORDER_DB_USER     Postgres user
//	ORDER_DB_PASSWORD Postgres password
//	ORDER_DB_NAME     Postgres database name
//	KAFKA_BROKERS     comma-separated broker list (default kafka:9092)
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/segmentio/kafka-go"
)

// Order represents a persisted order row.
type Order struct {
	ID          int64  `json:"id"`
	CustomerID  string `json:"customerId"`
	TotalAmount string `json:"totalAmount"` // stored as NUMERIC(12,2) → string
}

// OrderEventPayload mirrors the Kafka message sent to "order-events".
type OrderEventPayload struct {
	OrderID     int64   `json:"orderId"`
	CustomerID  string  `json:"customerId"`
	TotalAmount string  `json:"totalAmount"`
	ProductName *string `json:"productName"`
	Quantity    *int    `json:"quantity"`
}

// createOrderInput is the request body for POST /orders.
type createOrderInput struct {
	CustomerID  string   `json:"customerId"`
	TotalAmount float64  `json:"totalAmount"`
	ProductName *string  `json:"productName"`
	Quantity    *int     `json:"quantity"`
}

// app holds shared dependencies.
type app struct {
	db     *pgxpool.Pool
	writer *kafka.Writer
}

func main() {
	port := envOrDefault("PORT", "3001")

	// Build Postgres DSN from individual env vars; default to order/order/order_db for dev.
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		envOrDefault("ORDER_DB_HOST", "localhost"),
		envOrDefault("ORDER_DB_PORT", "5432"),
		envOrDefault("ORDER_DB_USER", "order"),
		envOrDefault("ORDER_DB_PASSWORD", "order"),
		envOrDefault("ORDER_DB_NAME", "order_db"),
	)

	// Retry Postgres connection — service may start before DB is ready.
	var pool *pgxpool.Pool
	for i := 0; i < 10; i++ {
		var err error
		pool, err = pgxpool.New(context.Background(), dsn)
		if err == nil {
			if pingErr := pool.Ping(context.Background()); pingErr == nil {
				break
			}
		}
		log.Printf("waiting for postgres (%d/10)...", i+1)
		time.Sleep(3 * time.Second)
	}
	if pool == nil {
		log.Fatal("could not connect to postgres")
	}
	defer pool.Close()

	// Ensure orders table exists (synchronize:false equivalent — explicit DDL).
	if _, err := pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS orders (
			id           BIGSERIAL PRIMARY KEY,
			customer_id  TEXT        NOT NULL,
			total_amount NUMERIC(12,2) NOT NULL
		)
	`); err != nil {
		log.Fatalf("could not create orders table: %v", err)
	}

	brokerList := envOrDefault("KAFKA_BROKERS", "kafka:9092")

	// Retry Kafka TCP connectivity before creating the writer.
	for i := 0; i < 15; i++ {
		conn, err := net.DialTimeout("tcp", strings.Split(brokerList, ",")[0], 2*time.Second)
		if err == nil {
			conn.Close()
			break
		}
		log.Printf("waiting for kafka (%d/15)...", i+1)
		time.Sleep(3 * time.Second)
	}

	w := &kafka.Writer{
		Addr:                   kafka.TCP(strings.Split(brokerList, ",")...),
		Topic:                  "order-events",
		AllowAutoTopicCreation: true,
		// Balancer round-robin matches segmentio default.
		Balancer: &kafka.LeastBytes{},
	}
	defer w.Close()

	a := &app{db: pool, writer: w}

	mux := http.NewServeMux()
	mux.HandleFunc("/orders", a.handleOrders)

	addr := "0.0.0.0:" + port
	log.Printf("order-service listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("order-service failed: %v", err)
	}
}

// handleOrders dispatches POST (create) — other methods return 405.
func (a *app) handleOrders(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		writeJSON(w, map[string]string{"message": "method not allowed"})
		return
	}
	a.createOrder(w, r)
}

// createOrder persists an order to Postgres then emits "order-events" to Kafka.
func (a *app) createOrder(w http.ResponseWriter, r *http.Request) {
	var input createOrderInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		writeJSON(w, map[string]string{"message": "invalid json"})
		return
	}
	if input.CustomerID == "" {
		w.WriteHeader(http.StatusBadRequest)
		writeJSON(w, map[string]string{"message": "customerId is required"})
		return
	}

	// Format totalAmount as NUMERIC(12,2) string — mirrors TS toFixed(2).
	totalStr := fmt.Sprintf("%.2f", input.TotalAmount)

	var order Order
	err := a.db.QueryRow(
		r.Context(),
		`INSERT INTO orders (customer_id, total_amount) VALUES ($1, $2)
		 RETURNING id, customer_id, total_amount`,
		input.CustomerID,
		totalStr,
	).Scan(&order.ID, &order.CustomerID, &order.TotalAmount)
	if err != nil {
		log.Printf("db insert error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		writeJSON(w, map[string]string{"message": "internal server error"})
		return
	}

	// Emit Kafka event — fire-and-forget style; log on error but still return 201.
	payload := OrderEventPayload{
		OrderID:     order.ID,
		CustomerID:  order.CustomerID,
		TotalAmount: order.TotalAmount,
		ProductName: input.ProductName,
		Quantity:    input.Quantity,
	}
	msgBytes, _ := json.Marshal(payload)
	if err := a.writer.WriteMessages(r.Context(), kafka.Message{
		Value: msgBytes,
	}); err != nil {
		log.Printf("kafka emit error: %v", err)
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, order)
}

// writeJSON marshals v as JSON to w; logs any encode error.
func writeJSON(w http.ResponseWriter, v any) {
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("json encode error: %v", err)
	}
}

// envOrDefault returns the env var value or fallback.
func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
