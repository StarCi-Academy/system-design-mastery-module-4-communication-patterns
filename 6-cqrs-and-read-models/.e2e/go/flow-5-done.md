# Flow 5 — read-service chết tạm thời rồi hồi sinh (luồng lỗi/biên · Go)

## 1. Dừng read-service

```bash
docker compose stop cqrs-read-service-go
# Container cqrs-read-service-go Stopped
```

## 2. Ghi trong khi read-service DOWN (write vẫn thành công)

```bash
curl -s -X POST http://localhost:3010/customer/update \
  -H "Content-Type: application/json" \
  -d '{"id":"c3003","name":"Carol While Down","email":"carol@example.com"}'
```

```json
{"id":"c3003","name":"Carol While Down","email":"carol@example.com"}   [HTTP 200]
```

## 3. Event buffer trong queue bền vững (read down)

```bash
docker compose exec rabbitmq rabbitmqctl list_queues name messages
# cqrs.customer.profile    1

curl http://localhost:3011/customer/c3003
# read c3003 -> HTTP 000 (connection refused)
```

## 4. Hồi sinh read-service → drain queue → read model hội tụ

```bash
docker compose start cqrs-read-service-go

docker compose exec rabbitmq rabbitmqctl list_queues name messages messages_unacknowledged
# cqrs.customer.profile    0    0

curl -s http://localhost:3011/customer/c3003
```

```json
{"id":"c3003","name":"Carol While Down","email":"carol@example.com"}   [HTTP 200]
```

PASS — write decoupled khỏi read; event không mất nhờ queue `durable` + publish persistent; read-service hồi sinh consume event tồn đọng, project vào Elasticsearch, queue về `0/0`, `c3003` truy vấn được. Eventual consistency + resilience của CQRS qua broker.
