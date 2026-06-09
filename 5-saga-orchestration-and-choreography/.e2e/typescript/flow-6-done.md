# TypeScript — Flow 6: re-deliver event trung (idempotency, luong bien)

Goi lai dung inventory check cua don 2 (don het kho) de mo phong mot event bi consume lan hai. Kiem chung KHONG sinh them refund.

## Buoc 1 — re-call POST /check don 2 -> van OUT_OF_STOCK

```
POST http://localhost:3003/check  -d {"orderId":2,"productId":1,"quantity":1}

-> {"ok":false,"orderId":2,"productId":1,"quantity":1,"status":"OUT_OF_STOCK","message":"Product is out of stock for requested quantity","remainingStock":0}
```

## Buoc 2 — payment KHONG refund lan hai (dem dong "Refunded order" giu nguyen 1)

```
$ docker compose logs saga-payment-service | grep -c "Refunded order"
1

# log refund chi co dung 1 dong:
payment-service  [PaymentService]  Refunded order "2"
```

## Buoc 3 — stock product 1 van 0 (khong bi dung)

```
GET http://localhost:3003/stock
[{"id":1,"stock":0},{"id":2,"stock":49}]
```

PASS — goi lai KHONG kich hoat refund thu hai (`handleSagaEvent` guard `if (!row || row.status === "REFUNDED") return` thoat som). Moi buoc saga phai idempotent vi Kafka giao at-least-once: guard `status === "REFUNDED"` o payment + khoa `fulfillments` o inventory dam bao event lap khong tru kho hay hoan tien hai lan.
