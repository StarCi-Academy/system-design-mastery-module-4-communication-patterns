# Flow 2 - Create order in Order Service (PostgreSQL) (Java)

**Status**: done  
**Port**: 3011 (host) → 3011 (container)  
**Stack**: 4-database-per-service-java (docker compose in `1-java/.docker`)

## Command

```bash
curl -s -X POST http://localhost:3011/orders -H "Content-Type: application/json" -d '{"customerId":"user_01","totalAmount":2500,"productName":"Macbook M3","quantity":2}'
```

## Real Output

```json
{"id":1,"customerId":"user_01","totalAmount":2500.00}
```

## Conclusion

POST /orders (Spring `@RestController` `OrderController` → `OrderService.create` → JPA `repo.save` → `KafkaTemplate.send("order-events", ...)`) returns HTTP 201 immediately with a PostgreSQL `IDENTITY` `id`. `totalAmount` is a JPA `BigDecimal` rounded to 2dp (`setScale(2, HALF_UP)`) and serialized by Jackson as the JSON number `2500.00`. The response carries no stock field: Order Service writes only its own PostgreSQL then emits the event and replies — it never waits for Inventory.
