# Flow 1 - Create product in Inventory (MongoDB) (C#)

**Status**: done  
**Port**: 3022 (host) → 3022 (container)  
**Stack**: 4-database-per-service-csharp (docker compose in `2-csharp/.docker`)

## Command

```bash
curl -s -X POST http://localhost:3022/inventory -H "Content-Type: application/json" -d '{"name":"Macbook M3","stock":50}'
```

## Real Output

```json
{"id":"6a287766707736b2f173bdc0","name":"Macbook M3","stock":50}
```

## Conclusion

POST /inventory (ASP.NET Core minimal API `app.MapPost("/inventory")` → `IMongoCollection<Product>.InsertOneAsync`) returns HTTP 201 with a MongoDB document carrying a generated `id` (`[BsonRepresentation(BsonType.ObjectId)]`). Order Service is not involved; Inventory owns its MongoDB exclusively (`mongo-inventory`, internal port 27017). The `products` collection stores name + stock only.
