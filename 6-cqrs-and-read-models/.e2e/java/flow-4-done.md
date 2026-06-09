# Flow 4 — Truy vấn một `id` chưa tồn tại (Java)

## Command

```bash
curl -s -i http://localhost:3011/customer/ghost-id-404
```

## Output thật (HTTP 404)

```
HTTP/1.1 404
Content-Length: 0
```

PASS — read-service truy vấn Elasticsearch theo `id`; `getById` trả `null` khi không tìm thấy → controller trả `404 Not Found` (body rỗng). Read model chỉ chứa document đã project từ event.
