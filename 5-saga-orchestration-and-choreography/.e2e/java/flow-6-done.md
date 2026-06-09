# Java — Flow 6: re-deliver event trung (idempotency, luong bien)

Goi lai dung `/check` cua order 1 (don da fulfilled) de mo phong mot event bi consume lan hai. Kiem chung KHONG tru kho lan hai.

## Buoc 1 — re-call POST /check order 1 -> ALREADY_FULFILLED (khong tru kho)

```
POST http://localhost:3012/check  -d {"orderId":1,"productId":2,"quantity":1}

-> {"ok":true,"orderId":1,"productId":2,"quantity":1,"status":"ALREADY_FULFILLED","message":"Order has already been fulfilled","remainingStock":null}
```

## Buoc 2 — Mongo stock product 2 van 49 (KHONG double-decrement)

```
mongosh inventory: db.products.find({},{_id:1,stock:1})
[ { _id: 1, stock: 0 }, { _id: 2, stock: 49 } ]
```

PASS — goi lai KHONG tru kho lan hai: `StockService.tryFulfill` kiem `FulfillmentRepository` truoc, thay order 1 da co ban ghi -> tra `ALREADY_FULFILLED` va return ngay (khong `$inc stock`). Moi buoc saga phai idempotent vi Kafka giao at-least-once; khoa fulfillments (theo orderId) dam bao event lap khong tru kho trung.
