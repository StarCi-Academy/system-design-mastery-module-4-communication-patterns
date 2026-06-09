# Flow 2 - Create order in Order Service (PostgreSQL) (Go)

**Status**: done  
**Port**: 3011 (host) → 3011 (container)  
**Stack**: 4-database-per-service-go (docker compose in `3-go/.docker`)

## Command

```bash
curl -s -X POST http://localhost:3011/orders -H "Content-Type: application/json" -d '{"customerId":"user_01","totalAmount":2500,"productName":"Macbook M3","quantity":2}'
```

## Real Output

```json
{"id":1,"customerId":"user_01","totalAmount":"2500.00"}
```

## Conclusion

POST /orders (`net/http` `handleOrders` → `createOrder` → pgx `INSERT ... RETURNING` → `kafka.Writer.WriteMessages` on topic `order-events`) returns HTTP 201 immediately with a PostgreSQL `BIGSERIAL` `id` and `totalAmount` formatted as a `NUMERIC(12,2)` string `"2500.00"` (Go `fmt.Sprintf("%.2f", ...)`). The response carries no stock field: Order Service writes only its own PostgreSQL then emits the event and replies — it never waits for Inventory.
