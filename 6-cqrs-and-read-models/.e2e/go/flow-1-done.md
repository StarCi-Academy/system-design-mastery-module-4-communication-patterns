# Flow 1 — Gửi command tạo hồ sơ qua write-service (Go)

Stack: `net/http` + pgx (write) + RabbitMQ (amqp091-go) + Elasticsearch (go-elasticsearch). Host ports: write `3010`, read `3011`, ES `9202`, RabbitMQ `5675/15675`.

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

PASS — write-service nhận command, upsert vào PostgreSQL (`INSERT ... ON CONFLICT DO UPDATE`, Write Model), rồi publish event lên RabbitMQ queue bền vững `cqrs.customer.profile` (delivery mode persistent).
