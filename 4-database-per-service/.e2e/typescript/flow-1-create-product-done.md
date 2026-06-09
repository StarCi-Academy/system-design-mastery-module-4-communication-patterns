# Flow 1 - Create product in Inventory (MongoDB) (TypeScript)

**Status**: done  
**Port**: 3002 (host) → 3002 (container)  
**Stack**: 4-database-per-service (docker compose in `.docker`, TS at repo root)

## Command

```bash
curl -s -X POST http://localhost:3002/inventory -H "Content-Type: application/json" -d '{"name":"Macbook M3","stock":50}'
```

## Real Output

```json
{"name":"Macbook M3","stock":50,"_id":"6a2846038852997b42e52000","__v":0}
```

## Conclusion

POST /inventory (NestJS `@Post()` → `InventoryService.create` → Mongoose `doc.save()`) returns HTTP 201 with a MongoDB document carrying `_id` (ObjectId) and `__v` — the document-store signature. Order Service is not involved; Inventory owns its MongoDB exclusively.
