# Go — Flow 2: kiem chung kho da bi tru

Sau happy path (flow 1) don 1 (product 2) da fulfilled. Go inventory chi expose `GET /stock` (khong co `/check` endpoint), nen kiem chung kho tru qua /stock + Mongo fulfillments.

## Buoc 1 — GET /stock (product 2 da 50 -> 49)

```
GET http://localhost:3013/stock
[{"id":1,"stock":0},{"id":2,"stock":49}]        # 50 - 1 = 49
```

## Buoc 2 — Mongo fulfillments giu khoa idempotent cho order 1

```
inventory-service log: fulfilled order 1 (product 2, qty 1)
# fulfillments._id = 1 (unique) — re-deliver event sau nay se bi skip (xem flow 6)
```

PASS — buoc inventory da commit local transaction tren MongoDB (`$inc stock -1` + InsertOne fulfillment `_id=1`). Stock product 2 giam dung 1 don vi (50->49). Ban ghi fulfillment dong vai tro khoa idempotent: event PAYMENT_CAPTURED lap lai cho order 1 se khong tru kho lan hai.
