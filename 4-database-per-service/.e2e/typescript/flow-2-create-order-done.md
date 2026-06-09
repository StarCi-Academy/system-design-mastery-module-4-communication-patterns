# Flow 2 - Create order in Order Service (PostgreSQL) (TypeScript)

**Status**: done  
**Port**: 3001 (host) → 3001 (container)  
**Stack**: 4-database-per-service (docker compose in `.docker`, TS at repo root)

## Command

```bash
curl -s -X POST http://localhost:3001/orders -H "Content-Type: application/json" -d '{"customerId":"user_01","totalAmount":2500,"productName":"Macbook M3","quantity":2}'
```

## Real Output

```json
{"customerId":"user_01","totalAmount":"2500.00","id":1}
```

## Conclusion

POST /orders (NestJS `@Post()` → `OrdersService.create` → TypeORM `repo.save()` → `kafka.emit("order-events", ...)`) returns HTTP 201 immediately with a PostgreSQL auto-increment `id` and `totalAmount` as a NUMERIC(12,2) string `"2500.00"`. The response carries no stock field: Order Service writes only its own PostgreSQL then emits the event and replies — it never waits for Inventory.
