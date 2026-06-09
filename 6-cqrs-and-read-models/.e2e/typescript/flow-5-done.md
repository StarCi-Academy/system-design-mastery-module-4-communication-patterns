# Flow 5 — read-service chết tạm thời rồi hồi sinh (luồng lỗi/biên · TypeScript)

Chứng minh decoupling + durable queue: write-service vẫn nhận command khi read-service chết; event nằm chờ trong queue bền vững; read-service hồi sinh thì tiêu thụ nốt và read model hội tụ.

## 1. Dừng read-service

```bash
docker compose stop cqrs-read-service
# Container cqrs-read-service Stopped
```

## 2. Ghi trong khi read-service DOWN (write vẫn thành công)

```bash
curl -s -X POST http://localhost:3000/customer/update \
  -H "Content-Type: application/json" \
  -d '{"id":"c2002","name":"Bob While Down","email":"bob@example.com"}'
```

```json
{"id":"c2002","name":"Bob While Down","email":"bob@example.com"}   [HTTP 201]
```

## 3. Event được buffer trong queue bền vững (read down)

```bash
docker compose exec rabbitmq rabbitmqctl list_queues name messages
# cqrs.customer.profile    1
```

Truy vấn read model lúc này thất bại (service down):

```
read GET c2002 -> HTTP 000 (connection refused)
```

## 4. Hồi sinh read-service → drain queue → read model hội tụ

```bash
docker compose start cqrs-read-service
```

```bash
docker compose exec rabbitmq rabbitmqctl list_queues name messages messages_unacknowledged
# cqrs.customer.profile    0    0

curl -s http://localhost:3001/customer/c2002
```

```json
{"id":"c2002","name":"Bob While Down","email":"bob@example.com"}   [HTTP 200]
```

PASS — đường ghi và đường đọc tách rời: write không phụ thuộc read còn sống. Event không mất nhờ queue `durable: true`; khi read-service trở lại, nó tiêu thụ event tồn đọng, project vào Elasticsearch, queue về `0/0` và `c2002` truy vấn được. Đây là bản chất eventual consistency + khả năng phục hồi của CQRS qua message broker.
