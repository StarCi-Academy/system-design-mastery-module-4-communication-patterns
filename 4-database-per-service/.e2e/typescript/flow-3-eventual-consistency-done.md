# Flow 3 - Stock decremented via Kafka event (eventual consistency) (TypeScript)

**Status**: done  
**Port**: 3002 (host) → 3002 (container) · Kafka UI :8080  
**Stack**: 4-database-per-service (docker compose in `.docker`, TS at repo root)

## Command

```bash
# Inventory consumer log after the Flow 2 order
docker compose logs -f inventory-service
# Read current stock from MongoDB
docker exec -i mongo-inventory mongosh inventory_db --quiet --eval 'db.products.findOne({name:"Macbook M3"}).stock'
```

## Real Output

```text
[Nest] [OrderEventsController] Received "order-events" payload: {"orderId":1,"customerId":"user_01","totalAmount":"2500.00","productName":"Macbook M3","quantity":2}
[Nest] [InventoryService] Decrementing stock for "Macbook M3" by 2
```

```text
48
```

## Conclusion

After the Flow 2 order, the `@EventPattern("order-events")` consumer received the payload from Kafka and called `decrementStockByProductName("Macbook M3", 2)`, lowering MongoDB stock 50 → 48. The two databases are kept consistent through the event, not a cross-service join: Order wrote PostgreSQL, Kafka transported the event, Inventory updated MongoDB — eventual consistency with a measurable delay rather than an instant distributed transaction.
