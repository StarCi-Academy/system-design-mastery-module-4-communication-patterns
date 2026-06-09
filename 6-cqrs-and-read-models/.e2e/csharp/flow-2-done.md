# Flow 2 — Truy vấn read model qua read-service (C#)

## Command

```bash
curl -s http://localhost:3011/customer/c1001
```

## Output thật (HTTP 200)

```json
{"id":"c1001","name":"Alice Nguyen","email":"alice@example.com"}
```

PASS — read-service consume event từ RabbitMQ, index vào Elasticsearch (index `customers`), và serve `GET /customer/:id`. Dữ liệu đi từ Write Model (PostgreSQL) sang Read Model (Elasticsearch) qua broker.
