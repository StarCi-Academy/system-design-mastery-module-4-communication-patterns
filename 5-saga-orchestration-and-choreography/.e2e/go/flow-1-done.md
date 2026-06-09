# Go — Flow 1: tao don du kho (happy path) -> order COMPLETED

Go track (`net/http` + segmentio/kafka-go + pgx + mongo-driver). 3 service: order (PostgreSQL), payment (PostgreSQL), inventory (MongoDB). Mot topic Kafka `saga.demo.events`, choreography. Host port: order 3011, payment 3012, inventory 3013, broker 9192, Kafka UI 8180.

## Seed / ton kho ban dau

```
GET http://localhost:3013/stock
[{"id":1,"stock":0},{"id":2,"stock":50}]
```

## Trigger — POST /order product 2, qty 1

```
POST http://localhost:3011/order  -d {"productId":2,"quantity":1}

-> {"id":1,"productId":2,"quantity":1,"status":"PENDING"}
```

## Lan truyen saga (log that, 3 service)

```
order-service     consumed event "ORDER_CREATED" for order 1
payment-service   consumed event "ORDER_CREATED" for order 1
payment-service   payment captured for order 1
payment-service   consumed event "PAYMENT_CAPTURED" for order 1
inventory-service consumed event "PAYMENT_CAPTURED" for order 1
inventory-service fulfilled order 1 (product 2, qty 1)
order-service     consumed event "INVENTORY_OK" for order 1
```

## Ket qua — stock 50->49, order COMPLETED, payment CAPTURED

```
GET /stock  -> [{"id":1,"stock":0},{"id":2,"stock":49}]      # 50 - 1 = 49

psql orders:   id=1 product_id=2 qty=1 status=COMPLETED
psql payments: order_id=1 status=CAPTURED
```

PASS — saga chay het chuoi `ORDER_CREATED -> PAYMENT_CAPTURED -> INVENTORY_OK` bat dong bo tren Kafka. Order 1 COMPLETED, payment CAPTURED, kho tru 50->49. Moi service commit local transaction trong DB rieng (Postgres orders / Postgres payments / Mongo inventory), khong 2PC.
