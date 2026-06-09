# Flow 4 — Truy vấn một `id` chưa tồn tại (TypeScript)

## Command

```bash
curl -s http://localhost:3001/customer/ghost-id-404
```

## Output thật (HTTP 404)

```json
{"message":"Not Found","statusCode":404}
```

PASS — read-service truy vấn Elasticsearch theo `id`; khi document không tồn tại, `getById` trả `null` và controller ném `NotFoundException` → HTTP 404. Read model chỉ chứa những gì đã được project từ event, không bịa dữ liệu.
