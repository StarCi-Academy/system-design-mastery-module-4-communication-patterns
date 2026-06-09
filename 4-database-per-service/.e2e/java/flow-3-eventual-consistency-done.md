# Flow 3 - Stock decremented via Kafka event (eventual consistency) (Java)

**Status**: done  
**Port**: 3012 (host) → 3012 (container) · Kafka UI :8081  
**Stack**: 4-database-per-service-java (docker compose in `1-java/.docker`)

## Command

```bash
# Inventory consumer log after the Flow 2 order
docker compose logs -f inventory-service
# Read current stock from MongoDB
docker exec -i mongo-inventory mongosh inventory_db --quiet --eval 'db.products.find({}, {name:1, stock:1}).toArray()'
```

## Real Output

```text
c.starci.inventory.OrderEventsListener   : Received order-events payload: productName=Macbook M3, quantity=2
com.starci.inventory.InventoryService    : Decrementing stock for "Macbook M3" by 2
```

```text
[ { _id: ObjectId('6a28754142e47247864cc6e4'), name: 'Macbook M3', stock: 48 } ]
```

## Conclusion

After the Flow 2 order, the `@KafkaListener(topics = "order-events", groupId = "database-per-service-inventory")` consumer deserialized the `OrderEventPayload` (Spring Kafka `JsonDeserializer`, type headers disabled) and called `decrementStockByProductName("Macbook M3", 2)`, lowering MongoDB stock 50 → 48. The two databases are kept consistent through the event, not a cross-service join: Order wrote PostgreSQL, Kafka transported the event, Inventory updated MongoDB — eventual consistency with a measurable delay rather than an instant distributed transaction.
