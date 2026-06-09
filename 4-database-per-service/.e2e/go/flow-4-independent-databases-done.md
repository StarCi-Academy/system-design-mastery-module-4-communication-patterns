# Flow 4 - Two independent databases (Go)

**Status**: done  
**Port**: postgres-order :5532 · mongo-inventory :27117  
**Stack**: 4-database-per-service-go (docker compose in `3-go/.docker`)

## Command

```bash
docker exec -i 4-dbps-go-postgres-order psql -U order -d order_db -c 'SELECT id, customer_id, total_amount FROM orders;'
docker exec -i 4-dbps-go-mongo-inventory mongosh inventory_db --quiet --eval 'db.products.find({}, {name:1, stock:1}).toArray()'
```

## Real Output

```text
 id | customer_id | total_amount
----+-------------+--------------
  1 | user_01     |      2500.00
(1 row)
```

```text
[ { _id: ObjectId('6a2873c636e44fa5e05d5b76'), name: 'Macbook M3', stock: 48 } ]
```

## Conclusion

The `orders` table holds only `id`, `customer_id`, `total_amount` — no stock column. The `products` collection holds only `name`, `stock` — no order/customer field. Each fact lives exclusively in the database of the service that owns it: order in PostgreSQL, stock in MongoDB. There is no shared database and no table containing both — this is data ownership, and the reason a cross-service `JOIN` is impossible. (Go uses snake_case `customer_id`/`total_amount` columns versus the TypeScript track's quoted camelCase, but the ownership boundary is identical.)
