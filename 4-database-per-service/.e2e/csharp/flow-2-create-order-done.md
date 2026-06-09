# Flow 2 - Create order in Order Service (PostgreSQL) (C#)

**Status**: done  
**Port**: 3021 (host) → 3021 (container)  
**Stack**: 4-database-per-service-csharp (docker compose in `2-csharp/.docker`)

## Command

```bash
curl -s -X POST http://localhost:3021/orders -H "Content-Type: application/json" -d '{"customerId":"user_01","totalAmount":2500,"productName":"Macbook M3","quantity":2}'
```

## Real Output

```json
{"id":1,"customerId":"user_01","totalAmount":2500}
```

## Conclusion

POST /orders (ASP.NET Core minimal API `app.MapPost("/orders")` → EF Core `db.Orders.Add` + `SaveChangesAsync` → Confluent.Kafka `producer.ProduceAsync("order-events", ...)`) returns HTTP 201 immediately with a PostgreSQL identity `id`. `totalAmount` is an EF Core `decimal` mapped to `numeric(12,2)` and serialized by `System.Text.Json` as the JSON number `2500`. The response carries no stock field: Order Service writes only its own PostgreSQL then emits the event and replies — it never waits for Inventory.
