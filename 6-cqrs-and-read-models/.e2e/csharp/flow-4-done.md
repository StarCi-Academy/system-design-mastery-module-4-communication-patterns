# Flow 4 — Truy vấn một `id` chưa tồn tại (C#)

## Command

```bash
curl -s -i http://localhost:3011/customer/ghost-id-404
```

## Output thật (HTTP 404)

```
HTTP/1.1 404 Not Found
Content-Length: 0
Server: Kestrel
```

PASS — read-service truy vấn Elasticsearch theo `id`; document không tồn tại → trả `404 Not Found` (Kestrel, body rỗng). Read model chỉ chứa document đã được project từ event.
