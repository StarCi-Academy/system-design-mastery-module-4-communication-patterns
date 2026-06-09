# Go — Flow 6: re-deliver event trung (idempotency, luong bien)

Go inventory khong co `/check` HTTP endpoint, nen mo phong event consume lan hai bang cach re-publish dung event `PAYMENT_CAPTURED` cho order 1 (don da fulfilled) truc tiep len topic. Kiem chung inventory skip va KHONG tru kho lan hai.

## Buoc 1 — re-produce duplicate PAYMENT_CAPTURED order 1 len saga.demo.events

```
$ echo '{"event":"PAYMENT_CAPTURED","orderId":1,"productId":2,"quantity":1,"amount":99.99}' \
    | kafka-console-producer.sh --bootstrap-server localhost:9092 --topic saga.demo.events
```

## Buoc 2 — inventory consume lai nhung SKIP (khoa fulfillments._id=1)

```
inventory-service consumed event "PAYMENT_CAPTURED" for order 1
order 1 already fulfilled, skipping
```

## Buoc 3 — stock product 2 van 49 (KHONG tru kho lan hai)

```
GET http://localhost:3013/stock
[{"id":1,"stock":0},{"id":2,"stock":49}]
```

PASS — event lap lai bi guard idempotent chan: `tryFulfill` tim thay `fulfillments._id=1` da ton tai -> log "already fulfilled, skipping" va return ngay, KHONG `$inc stock` lan hai. Moi buoc saga phai idempotent vi Kafka giao at-least-once; khoa fulfillments (`_id = orderId`, unique trong Mongo) dam bao event redelivery khong gay tru kho trung.
