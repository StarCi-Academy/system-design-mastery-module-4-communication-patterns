# TypeScript — Flow 1: tao don du kho (happy path) -> order COMPLETED

NestJS Microservices (ClientKafka + `@EventPattern`), 3 service (order, payment, inventory), moi service mot SQLite, mot topic Kafka `saga.demo.events`. Choreography: khong coordinator trung tam. Host port: order 3001, payment 3002, inventory 3003.

## Seed / ton kho ban dau

```
GET http://localhost:3003/stock
[{"id":1,"stock":0},{"id":2,"stock":50}]
```

## Trigger — POST /order product 2, qty 1

```
POST http://localhost:3001/order  -d {"productId":2,"quantity":1}

-> {"productId":2,"quantity":1,"status":"PENDING","id":1}
```

## Lan truyen saga (log Nest that, 3 service)

```
order-service     [KafkaProducerService]  Publishing event "ORDER_CREATED" for order "1"
payment-service   [SagaEventsController]  Consumed event "ORDER_CREATED" for order "1"
payment-service   [PaymentService]        Payment captured for order "1"
payment-service   [KafkaProducerService]  Publishing event "PAYMENT_CAPTURED" for order "1"
inventory-service [SagaEventsController]  Consumed event "PAYMENT_CAPTURED" for order "1"
inventory-service [KafkaProducerService]  Publishing event "INVENTORY_OK" for order "1"
order-service     [SagaEventsController]  Consumed event "INVENTORY_OK" for order "1"
order-service     [OrdersService]         Order "1" completed
```

PASS — order khoi tao `PENDING` roi tu chuyen `COMPLETED` qua chuoi `ORDER_CREATED -> PAYMENT_CAPTURED -> INVENTORY_OK` bat dong bo tren Kafka, khong mot transaction DB chung nao. Choreography thuan (khong orchestrator).
