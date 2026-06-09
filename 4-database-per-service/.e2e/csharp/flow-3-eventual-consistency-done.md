# Flow 3 - Stock decremented via Kafka event (eventual consistency) (C#)

**Status**: done  
**Port**: 3022 (host) → 3022 (container) · Kafka UI :4080  
**Stack**: 4-database-per-service-csharp (docker compose in `2-csharp/.docker`)

## Command

```bash
# Inventory consumer log after the Flow 2 order
docker compose logs -f inventory-service
# Read current stock from MongoDB
docker exec -i mongo-inventory mongosh inventory_db --quiet --eval 'db.products.find({}, {name:1, stock:1}).toArray()'
```

## Real Output

```text
OrderEventsConsumer[0] Received 'order-events' message: {"orderId":1,"customerId":"user_01","totalAmount":2500,"productName":"Macbook M3","quantity":2}
OrderEventsConsumer[0] Decrementing stock for 'Macbook M3' by 2 (current: 50).
```

```text
[ { _id: ObjectId('6a287766707736b2f173bdc0'), name: 'Macbook M3', stock: 48 } ]
```

## Conclusion

After the Flow 2 order, the `OrderEventsConsumer` `BackgroundService` (Confluent.Kafka `consumer.Consume`) deserialized the `OrderEventPayload` and called `DecrementStockAsync("Macbook M3", 2)` → `UpdateOneAsync` with `Inc(p => p.Stock, -2)`, lowering MongoDB stock 50 → 48. The two databases are kept consistent through the event, not a cross-service join: Order wrote PostgreSQL, Kafka transported the event, Inventory updated MongoDB — eventual consistency with a measurable delay rather than an instant distributed transaction. (The atomic `$inc` avoids read-modify-write races when events arrive close together.)
