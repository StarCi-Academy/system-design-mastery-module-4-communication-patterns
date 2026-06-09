# Flow 4 - Two independent databases (Java)

**Status**: done  
**Port**: postgres-order :5433 · mongo-inventory :27018  
**Stack**: 4-database-per-service-java (docker compose in `1-java/.docker`)

## Command

```bash
docker exec -i postgres-order psql -U order -d order_db -c 'SELECT id, customer_id, total_amount FROM orders;'
docker exec -i mongo-inventory mongosh inventory_db --quiet --eval 'db.products.find({}, {name:1, stock:1}).toArray()'
```

## Real Output

```text
 id | customer_id | total_amount
----+-------------+--------------
  1 | user_01     |      2500.00
(1 row)
```

```text
[ { _id: ObjectId('6a28754142e47247864cc6e4'), name: 'Macbook M3', stock: 48 } ]
```

## Conclusion

The `orders` table holds only `id`, `customer_id`, `total_amount` — no stock column (JPA `ddl-auto=update` created it from the `@Entity` mapping). The `products` collection holds only `name`, `stock` — no order/customer field. Each fact lives exclusively in the database of the service that owns it: order in PostgreSQL, stock in MongoDB. There is no shared database and no table containing both — this is data ownership, and the reason a cross-service `JOIN` is impossible.
