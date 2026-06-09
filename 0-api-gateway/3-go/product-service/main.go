// Package main — Product microservice: in-memory CRUD over HTTP.
// Exposes POST /products (create) and GET /products (list).
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

// Product represents a product record stored in-memory.
type Product struct {
	ID    int     `json:"id"`
	Name  string  `json:"name"`
	// Price uses float64 so JSON serialises as e.g. 1500 or 1500.5 (no forced ".0").
	Price float64 `json:"price"`
	Stock int     `json:"stock"`
}

var (
	mu       sync.Mutex
	products []Product
	counter  int
)

func main() {
	http.HandleFunc("/products", handleProducts)

	// Bind 0.0.0.0 for Docker port-publish to reach this process.
	log.Println("Product service listening on :3002")
	if err := http.ListenAndServe(":3002", nil); err != nil {
		log.Fatalf("product-service failed: %v", err)
	}
}

// handleProducts dispatches by method.
func handleProducts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	switch r.Method {
	case http.MethodPost:
		createProduct(w, r)
	case http.MethodGet:
		listProducts(w)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		if _, err := w.Write([]byte(`{"message":"method not allowed"}`)); err != nil {
			log.Printf("write error: %v", err)
		}
	}
}

// createProduct reads JSON body, persists, responds 201.
func createProduct(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name  string  `json:"name"`
		Price float64 `json:"price"`
		Stock int     `json:"stock"`
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
	p := Product{ID: counter, Name: input.Name, Price: input.Price, Stock: input.Stock}
	products = append(products, p)
	mu.Unlock()

	// 201 Created — gateway relays it as-is.
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(p); err != nil {
		log.Printf("encode error: %v", err)
	}
}

// listProducts returns a snapshot, never null.
func listProducts(w http.ResponseWriter) {
	mu.Lock()
	snapshot := make([]Product, len(products))
	copy(snapshot, products)
	mu.Unlock()

	if snapshot == nil {
		snapshot = []Product{}
	}
	if err := json.NewEncoder(w).Encode(snapshot); err != nil {
		log.Printf("encode error: %v", err)
	}
}
