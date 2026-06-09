// Package main — API Gateway using Go standard library net/http.
// Single entry point on :8000; routes requests by path prefix to internal services
// using httputil.ReverseProxy — no third-party dependencies.
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func main() {
	// Mỗi service upstream có một reverse proxy riêng. Client chỉ thấy địa chỉ
	// gateway :8000; các host nội bộ (user-service:3001...) được giấu hoàn toàn.
	userURL, _ := url.Parse("http://user-service:3001")
	productURL, _ := url.Parse("http://product-service:3002")
	orderURL, _ := url.Parse("http://order-service:3003")

	// NewSingleHostReverseProxy creates a proxy that rewrites Host to the target URL.
	userProxy := httputil.NewSingleHostReverseProxy(userURL)
	productProxy := httputil.NewSingleHostReverseProxy(productURL)
	orderProxy := httputil.NewSingleHostReverseProxy(orderURL)

	// Một handler catch-all duy nhất: chọn proxy theo prefix đường dẫn, nếu không khớp thì 404.
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Select the upstream proxy based on the path prefix — O(1) per rule.
		if strings.HasPrefix(path, "/users") {
			// Forward to user-service; proxy streams the response back verbatim.
			userProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(path, "/products") {
			productProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(path, "/orders") {
			orderProxy.ServeHTTP(w, r)
		} else {
			// Prefix lạ → gateway tự trả 404; không service nào bị gọi.
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"message": fmt.Sprintf("No route for %s", path),
			})
		}
	})

	// Listen on all interfaces so Docker's port-publish (host:8000 → container:8000) works.
	log.Println("API Gateway listening on :8000")
	if err := http.ListenAndServe(":8000", nil); err != nil {
		log.Fatalf("gateway failed: %v", err)
	}
}
