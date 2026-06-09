# Flow 5 - Order with unknown productName (failure/edge flow) (TypeScript)

**Status**: done  
**Port**: 3001 (host) → 3001 (container)  
**Stack**: 4-database-per-service (docker compose in `.docker`, TS at repo root)

## Command

```bash
curl -s -X POST http://localhost:3001/orders -H "Content-Type: application/json" -d '{"customerId":"user_02","totalAmount":99,"productName":"Ghost Product","quantity":1}'
# Inventory consumer log + unchanged stock
docker exec -i mongo-inventory mongosh inventory_db --quiet --eval 'db.products.findOne({name:"Macbook M3"}).stock'
```

## Real Output

```json
{"customerId":"user_02","totalAmount":"99.00","id":2}
```

```text
[Nest] [OrderEventsController] Received "order-events" payload: {"orderId":2,"customerId":"user_02","totalAmount":"99.00","productName":"Ghost Product","quantity":1}
```

```text
48
```

## Conclusion

The order to a non-existent product still returns HTTP 201 (id=2). The Inventory consumer received the event; `decrementStockByProductName` called `findOne({ name: "Ghost Product" })`, found nothing, and returned null — no decrement (stock stays 48), no error thrown back to Order. Producer and consumer are fully decoupled: a data mismatch on the consumer side does not break the producer. The price of eventual consistency is handling these skews (skip/retry/dead-letter) instead of rolling back like a transaction.
