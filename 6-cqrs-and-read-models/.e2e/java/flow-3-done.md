# Flow 3 — Cập nhật hồ sơ và quan sát read model hội tụ (Java)

## Command — cập nhật cùng `id`

```bash
curl -s -X POST http://localhost:3010/customer/update \
  -H "Content-Type: application/json" \
  -d '{"id":"c1001","name":"Alice Updated","email":"alice.new@example.com"}'
```

```json
{"id":"c1001","name":"Alice Updated","email":"alice.new@example.com"}
```

## Truy vấn lại read model sau ~2s — đã hội tụ

```bash
curl -s http://localhost:3011/customer/c1001
```

```json
{"id":"c1001","name":"Alice Updated","email":"alice.new@example.com"}
```

PASS — event cập nhật được publish, read-service index lại document theo `id` cố định (idempotent), read model hội tụ về `Alice Updated`. Queue drain `0/0`.
