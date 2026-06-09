# 2 — Saga (Kafka choreography)

This version is split into standalone NestJS services:

- `order-service` (HTTP + Kafka consumer/publisher)
- `payment-service` (HTTP + Kafka consumer/publisher)
- `inventory-service` (HTTP + Kafka consumer/publisher)

All saga events are sent through NestJS microservices transport Kafka (`@nestjs/microservices`).

Start Kafka + ZooKeeper first:

```bash
docker compose -f .docker/1-kafka.yaml up -d
```

Install and run the three services (three terminals):

```bash
cd order-service && npm install && npm run start:dev
cd payment-service && npm install && npm run start:dev
cd inventory-service && npm install && npm run start:dev
```

Products **1** (stock 0) and **2** (stock 50) are seeded in `inventory.sqlite`.

## Happy path (product 2)

```bash
curl -s -X POST http://localhost:3001/order -H "Content-Type: application/json" -d "{\"productId\":2,\"quantity\":1}"
curl -s -X POST http://localhost:3003/inventory/check -H "Content-Type: application/json" -d "{\"orderId\":1,\"productId\":2,\"quantity\":1}"
```

Kafka usually completes the saga after the first request; the second call is idempotent.

## Compensation path (product 1)

```bash
curl -s -X POST http://localhost:3001/order -H "Content-Type: application/json" -d "{\"productId\":1,\"quantity\":1}"
curl -s -X POST http://localhost:3003/inventory/check -H "Content-Type: application/json" -d "{\"orderId\":2,\"productId\":1,\"quantity\":1}"
```

## Teardown

```bash
docker compose -f .docker/1-kafka.yaml down -v
rm -f *.sqlite
```
