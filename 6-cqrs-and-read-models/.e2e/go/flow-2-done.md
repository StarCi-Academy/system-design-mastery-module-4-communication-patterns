# Flow 2 — Truy vấn read model qua read-service (Go)

## Command

```bash
curl -s http://localhost:3011/customer/c1001
```

## Output thật (HTTP 200)

```json
{"id":"c1001","name":"Alice Nguyen","email":"alice@example.com"}
```

PASS — read-service consume event từ RabbitMQ (`ch.Consume`, manual ack), index vào Elasticsearch (`es.Index` với `refresh=true`, index `customers`), serve `GET /customer/:id` (`es.Get` → unwrap `_source`). Write Model (PostgreSQL) → Read Model (Elasticsearch) qua broker.
