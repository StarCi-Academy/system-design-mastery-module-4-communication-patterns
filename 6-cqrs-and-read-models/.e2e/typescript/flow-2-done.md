# Flow 2 — Truy vấn read model qua read-service (TypeScript)

## Log read-service (consume event → project Elasticsearch)

```
[CustomerProfileRmqController]  Received "customer.profile.updated" for customer "c1001"
[CustomerProfileRmqController]  Processed "customer.profile.updated" for customer "c1001"
```

## Command

```bash
curl -s http://localhost:3001/customer/c1001
```

## Output thật (HTTP 200)

```json
{"id":"c1001","name":"Alice Nguyen","email":"alice@example.com"}
```

## Kiểm chứng read model trong Elasticsearch (truy vấn thẳng ES)

```bash
curl -s "http://localhost:9200/customers/_doc/c1001?pretty"
```

```json
"_source" : {
  "id" : "c1001",
  "name" : "Alice Nguyen",
  "email" : "alice@example.com"
}
```

PASS — read-service tiêu thụ event từ RabbitMQ, chiếu (project) sang read model Elasticsearch (index `customers`), và phục vụ `GET /customer/:id`. Dữ liệu đi từ Write Model (PostgreSQL) sang Read Model (Elasticsearch) qua broker — nhất quán cuối cùng.
