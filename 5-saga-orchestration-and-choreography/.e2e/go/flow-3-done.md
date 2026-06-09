# Go — Flow 3: tao don het kho (compensation path) -> order CANCELLED

Tao don product 1 (stock 0) de ep saga re vao nhanh bu tru.

## Trigger — POST /order product 1 (stock 0), qty 1

```
POST http://localhost:3011/order  -d {"productId":1,"quantity":1}

-> {"id":2,"productId":1,"quantity":1,"status":"PENDING"}
```

## Lan truyen saga + compensation (log that, 3 service)

```
order-service     consumed event "ORDER_CREATED" for order 2
payment-service   payment captured for order 2
inventory-service consumed event "PAYMENT_CAPTURED" for order 2
inventory-service out of stock for order 2 (product 1, qty 1)
inventory-service consumed event "INVENTORY_OUT_OF_STOCK" for order 2
payment-service   payment refunded for order 2
order-service     consumed event "INVENTORY_OUT_OF_STOCK" for order 2
order-service     consumed event "PAYMENT_REFUNDED" for order 2
```

## Ket qua — order CANCELLED (psql)

```
psql orders:   id=2 product_id=1 qty=1 status=CANCELLED
```

PASS — order het kho tu chuyen `CANCELLED` ma khong ai ra lenh huy: inventory phat `INVENTORY_OUT_OF_STOCK` -> payment chay compensating transaction (refund) -> `PAYMENT_REFUNDED` -> order tu huy. Chuoi bu tru lan nguoc qua event, thay cho `ROLLBACK` ACID khong ton tai giua cac service.
