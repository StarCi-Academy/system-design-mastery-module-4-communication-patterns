# Flow 3 — Cập nhật hồ sơ và quan sát read model hội tụ (TypeScript)

## Command — cập nhật cùng `id`

```bash
curl -s -X POST http://localhost:3000/customer/update \
  -H "Content-Type: application/json" \
  -d '{"id":"c1001","name":"Alice Updated","email":"alice.new@example.com"}'
```

## Output thật (HTTP 201)

```json
{"id":"c1001","name":"Alice Updated","email":"alice.new@example.com"}
```

## Log write-service

```
[UpsertCustomerHandler]  Updated existing customer profile for ID "c1001"
[RmqEventPublisher]  Broadcast completed for "customer.profile.updated" and customer "c1001"
```

## Truy vấn lại read model sau ~2s — đã hội tụ

```bash
curl -s http://localhost:3001/customer/c1001
```

```json
{"id":"c1001","name":"Alice Updated","email":"alice.new@example.com"}
```

## Trạng thái queue sau khi project xong

```
name                     messages  messages_unacknowledged
cqrs.customer.profile    0         0
```

PASS — event cập nhật được phát, read-service project lại document (`index` với `id` cố định nên idempotent — ghi đè đúng `c1001`), read model hội tụ về giá trị mới `Alice Updated`. Queue drain về `0/0` (event đã ack sau khi project thành công).
