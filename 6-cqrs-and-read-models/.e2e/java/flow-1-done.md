# Flow 1 — Gửi command tạo hồ sơ qua write-service (Java)

Stack: Spring Boot 3 + Spring Data JPA (write) + RabbitMQ + Elasticsearch (read). Host ports: write `3010`, read `3011`, ES `9201`, RabbitMQ `5673/15673`.

## Command

```bash
curl -s -X POST http://localhost:3010/customer/update \
  -H "Content-Type: application/json" \
  -d '{"id":"c1001","name":"Alice Nguyen","email":"alice@example.com"}'
```

## Output thật (HTTP 200)

```json
{"id":"c1001","name":"Alice Nguyen","email":"alice@example.com"}
```

PASS — write-service nhận command, upsert vào PostgreSQL (Write Model) qua JPA, rồi publish event `customer.profile.updated` lên RabbitMQ (queue `cqrs.customer.profile`).
