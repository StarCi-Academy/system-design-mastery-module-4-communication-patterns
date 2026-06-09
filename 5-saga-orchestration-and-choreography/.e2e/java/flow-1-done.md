# Java — Flow 1: tao don du kho (happy path) -> order COMPLETED

Java track (Spring Boot 3 + Spring Kafka). 2 service: order (PostgreSQL) + inventory (MongoDB) — choreography rut gon, KHONG co payment-service (inventory phan ung truc tiep voi ORDER_CREATED). Mot topic Kafka `saga.demo.events`. Host port: order 3011, inventory 3012, broker 9192, Kafka UI 8180.

## Seed / ton kho ban dau (log inventory)

```
SeedService: Seeded 2 demo products (id=1 stock=0, id=2 stock=50)
```

## Trigger — POST /order product 2, qty 1

```
POST http://localhost:3011/order  -d {"productId":2,"quantity":1}

-> {"id":1,"productId":2,"quantity":1,"status":"PENDING"}
```

## Lan truyen saga (log Spring that, 2 service)

```
order-service     OrderService         Order 1 created, ORDER_CREATED emitted
order-service     SagaEventsListener   Consumed event "ORDER_CREATED" for order "1"
inventory-service SagaEventsListener   Consumed event "ORDER_CREATED" for order "1"
inventory-service StockService         Fulfilled order 1
order-service     SagaEventsListener   Consumed event "INVENTORY_OK" for order "1"
order-service     OrderService         Order 1 completed
```

## Ket qua — stock 50->49, order COMPLETED

```
mongo inventory.products: [{_id:1,stock:0},{_id:2,stock:49}]      # 50 - 1 = 49
psql orders: id=1 product_id=2 qty=1 status=COMPLETED
```

PASS — saga 2 service: inventory phan ung truc tiep `ORDER_CREATED` -> `INVENTORY_OK` -> order COMPLETED, bat dong bo qua Kafka. Order (Postgres) va inventory (Mongo) moi ben commit local transaction trong DB rieng, khong 2PC. Choreography (khong coordinator).
