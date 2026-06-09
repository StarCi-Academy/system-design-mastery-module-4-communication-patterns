# Java — Flow 3: tao don het kho (compensation path) -> order CANCELLED

Tao don product 1 (stock 0) de ep saga re vao nhanh bu tru. Track Java 2 service: compensation = order tu CANCELLED khi nghe INVENTORY_OUT_OF_STOCK (khong co payment/refund vi track khong co payment-service).

## Trigger — POST /order product 1 (stock 0), qty 1

```
POST http://localhost:3011/order  -d {"productId":1,"quantity":1}

-> {"id":2,"productId":1,"quantity":1,"status":"PENDING"}
```

## Lan truyen saga + compensation (log Spring that)

```
order-service     OrderService         Order 2 created, ORDER_CREATED emitted
inventory-service SagaEventsListener   Consumed event "ORDER_CREATED" for order "2"
inventory-service StockService         Out of stock for order 2
order-service     SagaEventsListener   Consumed event "INVENTORY_OUT_OF_STOCK" for order "2"
order-service     OrderService         Order 2 cancelled (INVENTORY_OUT_OF_STOCK)
```

## Ket qua — order CANCELLED (psql)

```
psql orders: id=2 product_id=1 qty=1 status=CANCELLED
```

PASS — order het kho tu chuyen `CANCELLED` ma khong ai ra lenh huy: inventory phat `INVENTORY_OUT_OF_STOCK` -> order nghe va tu huy. Khong tru kho. Day la compensation qua event thay cho `ROLLBACK` ACID khong ton tai giua hai DB (Postgres orders + Mongo inventory).
