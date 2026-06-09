# Flow 4 — Truy vấn một `id` chưa tồn tại (Go)

## Command

```bash
curl -s http://localhost:3011/customer/ghost-id-404
```

## Output thật (HTTP 404)

```json
{"message":"not found"}
```

PASS — read-service gọi `es.Get`; Elasticsearch trả `404 Not Found` cho document không tồn tại → service trả `{"message":"not found"}` HTTP 404. Read model chỉ chứa document đã project từ event.
