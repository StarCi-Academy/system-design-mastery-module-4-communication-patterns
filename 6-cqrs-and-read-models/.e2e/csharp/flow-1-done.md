# Flow 1 — Gửi command tạo hồ sơ qua write-service (C#)

Stack: ASP.NET Core minimal API + Npgsql (write) + RabbitMQ + Elasticsearch (read). Host ports: write `3010`, read `3011`, ES `9201`, RabbitMQ `5674/15674`.

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

PASS — write-service nhận command, upsert vào PostgreSQL (Write Model), rồi publish event `customer.profile.updated` lên RabbitMQ queue `cqrs.customer.profile`.
