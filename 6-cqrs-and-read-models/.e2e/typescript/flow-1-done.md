# Flow 1 — Gửi command tạo hồ sơ qua write-service (TypeScript)

Stack: NestJS + TypeORM (write) + RabbitMQ + Elasticsearch (read). Host ports: write `3000`, read `3001`, ES `9200`, RabbitMQ `5672/15672`.

## Command

```bash
curl -s -X POST http://localhost:3000/customer/update \
  -H "Content-Type: application/json" \
  -d '{"id":"c1001","name":"Alice Nguyen","email":"alice@example.com"}'
```

## Output thật (HTTP 201 Created)

```json
{"id":"c1001","name":"Alice Nguyen","email":"alice@example.com"}
```

## Log write-service (command → persist PostgreSQL → emit RabbitMQ)

```
[CustomerController]  Received update request for customer "c1001"
[UpsertCustomerHandler]  Created new customer profile for ID "c1001"
[UpsertCustomerHandler]  Publishing CustomerProfileUpdatedEvent for ID "c1001" to EventBus
[RmqEventPublisher]  Broadcasting "customer.profile.updated" for customer "c1001"
[RmqEventPublisher]  Broadcast completed for "customer.profile.updated" and customer "c1001"
```

PASS — write-service nhận command, upsert vào PostgreSQL (Write Model) trong transaction, rồi phát domain event `customer.profile.updated` lên queue bền vững `cqrs.customer.profile`.
