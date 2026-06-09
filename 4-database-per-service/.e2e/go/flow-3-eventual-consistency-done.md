# Flow 3 - Stock decremented via Kafka event (eventual consistency) (Go)

**Status**: done  
**Port**: 3012 (host) → 3012 (container) · Kafka UI :8180  
**Stack**: 4-database-per-service-go (docker compose in `3-go/.docker`)

## Command

```bash
# Inventory consumer log after the Flow 2 order
docker compose logs -f inventory-service
# Read current stock from MongoDB
docker exec -i 4-dbps-go-mongo-inventory mongosh inventory_db --quiet --eval 'db.products.findOne({name:"Macbook M3"}).stock'
```

## Real Output

```text
received order-events: {"orderId":1,"customerId":"user_01","totalAmount":"2500.00","productName":"Macbook M3","quantity":2}
decrementing stock for "Macbook M3" by 2
```

```text
48
```

## Conclusion

After the Flow 2 order, the `kafka.Reader` consumer-group goroutine (`consumeOrderEvents`, group `inventory-group`) read the payload from Kafka and called `decrementStock("Macbook M3", 2)` → `UpdateOne` with `$inc: {stock: -2}`, lowering MongoDB stock 50 → 48. The two databases are kept consistent through the event, not a cross-service join: Order wrote PostgreSQL, Kafka transported the event, Inventory updated MongoDB — eventual consistency with a measurable delay rather than an instant distributed transaction.
