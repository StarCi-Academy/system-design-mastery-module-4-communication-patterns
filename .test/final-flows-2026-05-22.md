# M4 Communication Patterns — Final Flow Test Results (2026-05-22)

## L0 — API Gateway (Kong + 3 NestJS backends)

Stack: `kong-db` (postgres) + `kong-migrations` + `kong` + `konga` + 3 backend services (user, product, order). All backend images now follow `starciacademy/system-design-api-gateway-<svc>:latest`.

Direct backend endpoints (after compose up):
```
GET http://localhost:3001/users
[{"id":1,"name":"Alice","email":"alice@starci.com"},{"id":2,"name":"Bob","email":"bob@starci.com"}]

GET http://localhost:3002/products
[{"id":101,"name":"Laptop","price":1500},{"id":102,"name":"Smartphone","price":800}]

GET http://localhost:3003/orders
[{"id":1001,"product":"Laptop","quantity":1,"total":1500},{"id":1002,"product":"Smartphone","quantity":2,"total":1600}]
```

**Status: ✓ PASS** — All 3 backend services responding with correct mock data. Kong routing through `:8000` not exercised in this run but verified Kong + Konga came up healthy.

## L1 — Synchronous Communication (REST → gRPC)

Tested in earlier session. Gateway REST `:3000` → gRPC `user-service:5001` + `product-service:5002`. All 4 endpoints (`/users/1`, `/users/2`, `/products/1`, `/products/2`) returned correct data.

**Status: ✓ PASS**

## L2 — Asynchronous Event-Driven (Kafka)

Tested in earlier session. Order producer `:3001` → Kafka topic `order-events` → both inventory + notification consumers received the event.

**Status: ✓ PASS**

## L3 — Publish/Subscribe (NATS)

Stack: `nats` + `publisher-service` + 3 subscribers (analytics, audit, notification).

```
POST http://localhost:3001/publish
Body: {"type":"order.created","payload":{"orderId":"ord-001"}}
Response: {"message":"Event Published","type":"order.created"}

subscriber-analytics:
  analytics: {"type":"order.created","payload":{"orderId":"ord-001"},"timestamp":"2026-05-22T07:51:39.641Z"}

subscriber-audit:
  audit: {"type":"order.created","payload":{"orderId":"ord-001"},"timestamp":"2026-05-22T07:51:39.641Z"}

subscriber-notification:
  notification: {"type":"order.created","payload":{"orderId":"ord-001"},"timestamp":"2026-05-22T07:51:39.641Z"}
```

**Status: ✓ PASS** — All 3 subscribers received the event with full payload + timestamp.

## Image Naming (all under `starciacademy/system-design-`)

- `system-design-api-gateway-user-service:latest`
- `system-design-api-gateway-order-service:latest`
- `system-design-api-gateway-product-service:latest`
- `system-design-synchronous-communication-rest-grpc-gateway:latest`
- `system-design-synchronous-communication-rest-grpc-user-service:latest`
- `system-design-synchronous-communication-rest-grpc-product-service:latest`
- `system-design-asynchronous-event-driven-order-service:latest`
- `system-design-asynchronous-event-driven-inventory-service:latest`
- `system-design-asynchronous-event-driven-notification-service:latest`
- `system-design-publish-subscribe-pattern-publisher-service:latest`
- `system-design-publish-subscribe-pattern-subscriber-analytics:latest`
- `system-design-publish-subscribe-pattern-subscriber-audit:latest`
- `system-design-publish-subscribe-pattern-subscriber-notification:latest`
