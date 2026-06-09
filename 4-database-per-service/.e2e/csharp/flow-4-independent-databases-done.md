# Flow 4 - Two independent databases (C#)

**Status**: done  
**Port**: postgres-order :5434 · mongo-inventory :27019  
**Stack**: 4-database-per-service-csharp (docker compose in `2-csharp/.docker`)

## Command

```bash
docker exec -i postgres-order psql -U order -d order_db -c 'SELECT * FROM orders;'
docker exec -i mongo-inventory mongosh inventory_db --quiet --eval 'db.products.find({}, {name:1, stock:1}).toArray()'
```

## Real Output

```text
 Id | CustomerId | TotalAmount
----+------------+-------------
  1 | user_01    |     2500.00
  2 | user_02    |       99.00
(2 rows)
```

```text
[ { _id: ObjectId('6a287766707736b2f173bdc0'), name: 'Macbook M3', stock: 48 } ]
```

## Conclusion

The `orders` table holds only `Id`, `CustomerId`, `TotalAmount` — no stock column (EF Core `EnsureCreated` materialised the table from the `Order` entity, defaulting to PascalCase column names). The `products` collection holds only `name`, `stock` — no order/customer field. Each fact lives exclusively in the database of the service that owns it: order in PostgreSQL, stock in MongoDB. There is no shared database and no table containing both — this is data ownership, and the reason a cross-service `JOIN` is impossible. (Row 2 is the Flow 5 ghost order — persisted in Order's DB but it never touched Inventory's stock.)
