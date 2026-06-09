// Package main — User microservice: in-memory CRUD over HTTP.
// Exposes POST /users (create) and GET /users (list). No external dependencies.
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

// User represents a user record persisted in-memory for the lifetime of the container.
type User struct {
	// ID is auto-incremented; assigned by the service, not the caller.
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// store holds all users and a monotonic counter guarded by a mutex.
// sync.Mutex (not sync.RWMutex) because concurrent writes are expected.
var (
	mu      sync.Mutex
	users   []User
	counter int
)

func main() {
	// /users handles both POST (create) and GET (list); method is dispatched inside.
	http.HandleFunc("/users", handleUsers)

	// 0.0.0.0 is required so Docker's port-publish reaches the container.
	log.Println("User service listening on :3001")
	if err := http.ListenAndServe(":3001", nil); err != nil {
		log.Fatalf("user-service failed: %v", err)
	}
}

// handleUsers dispatches POST → create, GET → list, anything else → 405.
func handleUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	switch r.Method {
	case http.MethodPost:
		createUser(w, r)
	case http.MethodGet:
		listUsers(w)
	default:
		// Callers shouldn't reach here through the gateway, but guard defensively.
		w.WriteHeader(http.StatusMethodNotAllowed)
		if _, err := w.Write([]byte(`{"message":"method not allowed"}`)); err != nil {
			log.Printf("write error: %v", err)
		}
	}
}

// createUser decodes the JSON body, assigns a new ID, stores the record, and returns HTTP 201.
func createUser(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		// Malformed JSON → reject before touching shared state.
		w.WriteHeader(http.StatusBadRequest)
		if _, err2 := w.Write([]byte(`{"message":"invalid json"}`)); err2 != nil {
			log.Printf("write error: %v", err2)
		}
		return
	}

	// Critical section: increment counter and append atomically.
	mu.Lock()
	counter++
	u := User{ID: counter, Name: input.Name, Email: input.Email}
	users = append(users, u)
	mu.Unlock()

	// 201 Created matches the API contract; gateway relays the status verbatim.
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(u); err != nil {
		log.Printf("encode error: %v", err)
	}
}

// listUsers returns a snapshot of the current user list; never returns null.
func listUsers(w http.ResponseWriter) {
	mu.Lock()
	// Copy slice under lock to avoid a race with concurrent writes.
	snapshot := make([]User, len(users))
	copy(snapshot, users)
	mu.Unlock()

	// Encode snapshot; if empty, produces `[]` (not `null`) due to json.Encoder behaviour with make([]T,0).
	if snapshot == nil {
		snapshot = []User{}
	}
	if err := json.NewEncoder(w).Encode(snapshot); err != nil {
		log.Printf("encode error: %v", err)
	}
}
