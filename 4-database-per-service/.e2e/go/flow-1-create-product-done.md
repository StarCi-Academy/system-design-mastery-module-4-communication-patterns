# Flow 1 - Create product in Inventory (MongoDB) (Go)

**Status**: done  
**Port**: 3012 (host) → 3012 (container)  
**Stack**: 4-database-per-service-go (docker compose in `3-go/.docker`)

## Command

```bash
curl -s -X POST http://localhost:3012/inventory -H "Content-Type: application/json" -d '{"name":"Macbook M3","stock":50}'
```

## Real Output

```json
{"_id":"6a2873c636e44fa5e05d5b76","name":"Macbook M3","stock":50}
```

## Conclusion

POST /inventory (`net/http` `mux.HandleFunc("/inventory")` → `createProduct` → `products.InsertOne`) returns HTTP 201 with a MongoDB document carrying a freshly minted `_id` (ObjectId). Order Service is not involved; Inventory owns its MongoDB exclusively. The Go track talks to its own Mongo (`mongo-inventory`, host port 27117) over the `mongo-go-driver`.
