# Flow 1 - Create product in Inventory (MongoDB) (Java)

**Status**: done  
**Port**: 3012 (host) → 3012 (container)  
**Stack**: 4-database-per-service-java (docker compose in `1-java/.docker`)

## Command

```bash
curl -s -X POST http://localhost:3012/inventory -H "Content-Type: application/json" -d '{"name":"Macbook M3","stock":50}'
```

## Real Output

```json
{"id":"6a28754142e47247864cc6e4","name":"Macbook M3","stock":50}
```

## Conclusion

POST /inventory (Spring `@RestController` `InventoryController` → `InventoryService.create` → Spring Data MongoDB `repo.save`) returns HTTP 201 with a MongoDB document carrying a generated `id` (ObjectId hex). Order Service is not involved; Inventory owns its MongoDB exclusively (`mongo-inventory`, internal port 27017). The `@Document(collection = "products")` mapping persists name + stock only.
