# Java — Flow 2: kiem chung kho da bi tru

Sau happy path (flow 1) don 1 (product 2) da fulfilled. Goi lai `/check` tra ALREADY_FULFILLED + xac nhan kho Mongo da tru.

## Buoc 1 — POST /check don 1 (da fulfilled) -> ALREADY_FULFILLED

```
POST http://localhost:3012/check  -d {"orderId":1,"productId":2,"quantity":1}

-> {"ok":true,"orderId":1,"productId":2,"quantity":1,"status":"ALREADY_FULFILLED","message":"Order has already been fulfilled","remainingStock":null}
```

## Buoc 2 — Mongo inventory.products: product 2 da 50 -> 49

```
mongosh inventory: db.products.find({},{_id:1,stock:1})
[ { _id: 1, stock: 0 }, { _id: 2, stock: 49 } ]
```

PASS — buoc inventory da commit local transaction tren MongoDB (decrement stock 50->49 + luu fulfillment record). Goi lai don da xong tra `ALREADY_FULFILLED` (FulfillmentRepository tim thay ban ghi cu) thay vi tru kho lan hai — bang fulfillments la khoa idempotent.
