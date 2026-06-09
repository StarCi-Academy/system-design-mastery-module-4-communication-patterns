// Package main — Order microservice: in-memory CRUD over HTTP.
// Every newly-created order carries status:"PENDING" — the gateway does not set this;
// the domain rule lives in the service layer, not in the routing layer.
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

// Order represents an order record.
// ID and ProductID are int64 to match the lesson body §2.1.3.3 snippet type declarations.
type Order struct {
	ID        int64  `json:"id"`
	ProductID int64  `json:"productId"`
	Quantity  int    `json:"quantity"`
	// Status is always "PENDING" on creation; future workflows may change it.
	Status    string `json:"status"`
}

var (
	mu      sync.Mutex
	orders  []Order
	counter int64
)

func main() {
	http.HandleFunc("/orders", handleOrders)

	// 0.0.0.0 required for Docker port-publish.
	log.Println("Order service listening on :3003")
	if err := http.ListenAndServe(":3003", nil); err != nil {
		log.Fatalf("order-service failed: %v", err)
	}
}

// handleOrders dispatches POST (create) and GET (list).
func handleOrders(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	switch r.Method {
	case http.MethodPost:
		createOrder(w, r)
	case http.MethodGet:
		listOrders(w)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		if _, err := w.Write([]byte(`{"message":"method not allowed"}`)); err != nil {
			log.Printf("write error: %v", err)
		}
	}
}

// createOrder always sets status:"PENDING" — this is the invariant from §2.1.3.3.
func createOrder(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ProductID int64 `json:"productId"`
		Quantity  int   `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		if _, err2 := w.Write([]byte(`{"message":"invalid json"}`)); err2 != nil {
			log.Printf("write error: %v", err2)
		}
		return
	}

	mu.Lock()
	counter++
	// PENDING invariant: the order-service sets status at creation time.
	// Gateway never inspects or modifies the body — it is a transparent proxy.
	o := Order{ID: counter, ProductID: input.ProductID, Quantity: input.Quantity, Status: "PENDING"}
	orders = append(orders, o)
	mu.Unlock()

	// Return 201 Created with the new order record.
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(o); err != nil {
		log.Printf("encode error: %v", err)
	}
}

// listOrders returns a snapshot; never returns null.
func listOrders(w http.ResponseWriter) {
	mu.Lock()
	snapshot := make([]Order, len(orders))
	copy(snapshot, orders)
	mu.Unlock()

	if snapshot == nil {
		snapshot = []Order{}
	}
	if err := json.NewEncoder(w).Encode(snapshot); err != nil {
		log.Printf("encode error: %v", err)
	}
}
