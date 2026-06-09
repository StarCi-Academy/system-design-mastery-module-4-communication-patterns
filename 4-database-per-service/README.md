# 4 — Database per Service

Working directory: `system-design-mastery-module-4-communication-patterns/4-database-per-service`

## Start all infrastructure + services

```bash
cd .docker
docker compose up -d
```

## Logs

```bash
docker compose -f .docker/compose.yaml logs -f order-service inventory-service
```

## Sample curls (from course)

```bash
curl -s -X POST http://localhost:3002/inventory -H "Content-Type: application/json" -d "{\"name\":\"Macbook M3\",\"stock\":50}"
curl -s -X POST http://localhost:3001/orders -H "Content-Type: application/json" -d "{\"customerId\":\"user_01\",\"totalAmount\":2500}"
```

## Teardown

```bash
docker compose -f .docker/compose.yaml down -v
```
