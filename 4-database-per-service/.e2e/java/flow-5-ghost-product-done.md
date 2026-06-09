# Flow 5 - Order with unknown productName (failure/edge flow) (Java)

**Status**: done  
**Port**: 3011 (host) → 3011 (container)  
**Stack**: 4-database-per-service-java (docker compose in `1-java/.docker`)

## Command

```bash
curl -s -X POST http://localhost:3011/orders -H "Content-Type: application/json" -d '{"customerId":"user_02","totalAmount":99,"productName":"Ghost Product","quantity":1}'
# Inventory consumer log + unchanged stock
docker exec -i mongo-inventory mongosh inventory_db --quiet --eval 'db.products.find({}, {name:1, stock:1}).toArray()'
```

## Real Output

```json
{"id":2,"customerId":"user_02","totalAmount":99.00}
```

```text
c.starci.inventory.OrderEventsListener   : Received order-events payload: productName=Ghost Product, quantity=1
```

```text
[ { _id: ObjectId('6a28754142e47247864cc6e4'), name: 'Macbook M3', stock: 48 } ]
```

## Conclusion

The order to a non-existent product still returns HTTP 201 (id=2). The Inventory consumer received the event; `decrementStockByProductName` ran `repo.findByName("Ghost Product")`, got `Optional.empty()`, and returned null — no decrement (stock stays 48), no error thrown back to Order. Producer and consumer are fully decoupled: a data mismatch on the consumer side does not break the producer. The price of eventual consistency is handling these skews (skip/retry/dead-letter) instead of rolling back like a transaction.
