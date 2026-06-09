# TypeScript — Flow 3: tao don het kho (compensation path) -> order CANCELLED

Cung stack NestJS 3 service. Tao don product 1 (stock 0) de ep saga re vao nhanh bu tru.

## Trigger — POST /order product 1 (stock 0), qty 1

```
POST http://localhost:3001/order  -d {"productId":1,"quantity":1}

-> {"productId":1,"quantity":1,"status":"PENDING","id":2}
```

## Lan truyen saga + compensation (log Nest that, order-service)

```
order-service   [KafkaProducerService]  Publishing event "ORDER_CREATED" for order "2"
order-service   [SagaEventsController]   Consumed event "ORDER_CREATED" for order "2"
order-service   [SagaEventsController]   Consumed event "PAYMENT_CAPTURED" for order "2"
order-service   [SagaEventsController]   Consumed event "INVENTORY_OUT_OF_STOCK" for order "2"
order-service   [OrdersService]          Order "2" cancelled
order-service   [SagaEventsController]   Consumed event "PAYMENT_REFUNDED" for order "2"
order-service   [OrdersService]          Order "2" cancelled
```

PASS — order het kho tu chuyen `CANCELLED` ma khong ai ra lenh huy: inventory phat `INVENTORY_OUT_OF_STOCK` -> payment tu chay compensating transaction -> `PAYMENT_REFUNDED` -> order tu huy. Chuoi bu tru lan nguoc qua event, thay cho `ROLLBACK` ACID khong ton tai giua cac service. (`handleSagaEvent` idempotent nen ca INVENTORY_OUT_OF_STOCK lan PAYMENT_REFUNDED deu dua order ve CANCELLED, khong loi.)
