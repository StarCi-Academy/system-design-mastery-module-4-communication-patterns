# Flow 5 - Order with unknown productName (failure/edge flow) (Go)

**Status**: done  
**Port**: 3011 (host) → 3011 (container)  
**Stack**: 4-database-per-service-go (docker compose in `3-go/.docker`)

## Command

```bash
curl -s -X POST http://localhost:3011/orders -H "Content-Type: application/json" -d '{"customerId":"user_02","totalAmount":99,"productName":"Ghost Product","quantity":1}'
# Inventory consumer log + unchanged stock
docker exec -i 4-dbps-go-mongo-inventory mongosh inventory_db --quiet --eval 'db.products.findOne({name:"Macbook M3"}).stock'
```

## Real Output

```json
{"id":2,"customerId":"user_02","totalAmount":"99.00"}
```

```text
received order-events: {"orderId":2,"customerId":"user_02","totalAmount":"99.00","productName":"Ghost Product","quantity":1}
product "Ghost Product" not found, skipping decrement
```

```text
48
```

## Conclusion

The order to a non-existent product still returns HTTP 201 (id=2). The Inventory consumer received the event; `decrementStock` called `FindOne({name: "Ghost Product"})`, hit `mongo.ErrNoDocuments`, logged "not found, skipping decrement" and returned nil — no decrement (stock stays 48), no error thrown back to Order. Producer and consumer are fully decoupled: a data mismatch on the consumer side does not break the producer. The price of eventual consistency is handling these skews (skip/retry/dead-letter) instead of rolling back like a transaction.
