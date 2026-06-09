# Flow 5 - Order with unknown productName (failure/edge flow) (C#)

**Status**: done  
**Port**: 3021 (host) → 3021 (container)  
**Stack**: 4-database-per-service-csharp (docker compose in `2-csharp/.docker`)

## Command

```bash
curl -s -X POST http://localhost:3021/orders -H "Content-Type: application/json" -d '{"customerId":"user_02","totalAmount":99,"productName":"Ghost Product","quantity":1}'
# Inventory consumer log + unchanged stock
docker exec -i mongo-inventory mongosh inventory_db --quiet --eval 'db.products.find({}, {name:1, stock:1}).toArray()'
```

## Real Output

```json
{"id":2,"customerId":"user_02","totalAmount":99}
```

```text
OrderEventsConsumer[0] Received 'order-events' message: {"orderId":2,"customerId":"user_02","totalAmount":99,"productName":"Ghost Product","quantity":1}
OrderEventsConsumer[0] Product 'Ghost Product' not found in inventory — skipping decrement.
```

```text
[ { _id: ObjectId('6a287766707736b2f173bdc0'), name: 'Macbook M3', stock: 48 } ]
```

## Conclusion

The order to a non-existent product still returns HTTP 201 (id=2). The Inventory consumer received the event; `DecrementStockAsync` ran `products.Find(p => p.Name == "Ghost Product")`, got null, logged a warning and returned — no decrement (stock stays 48), no error thrown back to Order. Producer and consumer are fully decoupled: a data mismatch on the consumer side does not break the producer. The price of eventual consistency is handling these skews (skip/retry/dead-letter) instead of rolling back like a transaction.
