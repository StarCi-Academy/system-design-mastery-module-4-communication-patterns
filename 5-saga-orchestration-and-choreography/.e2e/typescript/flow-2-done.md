# TypeScript — Flow 2: kiem chung kho da bi tru (idempotency check)

Sau happy path (flow 1), don 1 (product 2, qty 1) da fulfilled. Kiem chung kho da tru va goi lai check tra ALREADY_FULFILLED.

## Buoc 1 — GET /stock (product 2 da 50 -> 49)

```
GET http://localhost:3003/stock
[{"id":1,"stock":0},{"id":2,"stock":49}]        # 50 - 1 = 49
```

## Buoc 2 — POST /check don 1 (da fulfilled) -> ALREADY_FULFILLED

```
POST http://localhost:3003/check  -d {"orderId":1,"productId":2,"quantity":1}

-> {"ok":true,"orderId":1,"productId":2,"quantity":1,"status":"ALREADY_FULFILLED","message":"Order has already been fulfilled"}
```

PASS — buoc inventory da commit local transaction tren `inventory.sqlite` (tru kho 50->49 + ghi `fulfillments`). Bang `fulfillments` la khoa idempotent: goi lai don da xong tra `ALREADY_FULFILLED`, KHONG tru kho lan hai.
