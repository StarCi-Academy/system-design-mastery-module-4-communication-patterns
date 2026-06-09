# Flow 4 - Two independent databases (TypeScript)

**Status**: done  
**Port**: postgres-order :5432 · mongo-inventory :27017  
**Stack**: 4-database-per-service (docker compose in `.docker`, TS at repo root)

## Command

```bash
docker exec -i postgres-order psql -U order -d order_db -c 'SELECT id, "customerId", "totalAmount" FROM orders;'
docker exec -i mongo-inventory mongosh inventory_db --quiet --eval 'db.products.find({}, {name:1, stock:1}).toArray()'
```

## Real Output

```text
 id | customerId | totalAmount
----+------------+-------------
  1 | user_01    |     2500.00
(1 row)
```

```text
[ { _id: ObjectId('6a2846038852997b42e52000'), name: 'Macbook M3', stock: 48 } ]
```

## Conclusion

The `orders` table holds only `id`, `customerId`, `totalAmount` — no stock column. The `products` collection holds only `name`, `stock` — no order/customer field. Each fact lives exclusively in the database of the service that owns it: order in PostgreSQL, stock in MongoDB. There is no shared database and no table containing both — this is data ownership, and the reason a cross-service `JOIN` is impossible.
