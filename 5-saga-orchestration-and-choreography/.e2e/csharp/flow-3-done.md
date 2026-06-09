# C# — Flow 3: tao don het kho (compensation path) -> order CANCELLED

Tao don product 1 (stock 0) de ep saga re vao nhanh bu tru. Track C# 2 service: compensation = order tu CANCELLED khi nghe INVENTORY_OUT_OF_STOCK (khong co payment/refund vi track khong co payment-service).

## Trigger — POST /order product 1 (stock 0), qty 1

```
POST http://localhost:4001/order  -d {"productId":1,"quantity":1}

-> {"id":2,"productId":1,"quantity":1,"status":"PENDING"}
```

## Lan truyen saga + compensation (log .NET that)

```
order-service     Consumed saga event ORDER_CREATED for order 2
inventory-service Consumed saga event ORDER_CREATED for order 2
inventory-service Out of stock for order 2
order-service     Consumed saga event INVENTORY_OUT_OF_STOCK for order 2
order-service     Order 2 transitioned to CANCELLED
```

## Ket qua — order CANCELLED (psql)

```
psql orders: Id=2 ProductId=1 Quantity=1 Status=CANCELLED
```

PASS — order het kho tu chuyen `CANCELLED` ma khong ai ra lenh huy: inventory phat `INVENTORY_OUT_OF_STOCK` -> order nghe va tu huy. Khong tru kho. Day la compensation qua event thay cho `ROLLBACK` ACID khong ton tai giua hai DB (Postgres orders + Mongo inventory).
