# Flow 2 — Truy vấn read model qua read-service (Java)

## Command

```bash
curl -s http://localhost:3011/customer/c1001
```

## Output thật (HTTP 200)

```json
{"id":"c1001","name":"Alice Nguyen","email":"alice@example.com"}
```

PASS — read-service (`@RabbitListener`) consume event từ RabbitMQ, index vào Elasticsearch (index `customers`, mappings `id`/`email` keyword, `name` text), serve `GET /customer/:id`. Write Model (PostgreSQL) → Read Model (Elasticsearch) qua broker.
