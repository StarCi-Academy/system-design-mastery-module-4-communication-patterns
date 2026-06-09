# Go — Flow 4: kiem chung payment da REFUNDED

Doc log payment-service + bang payments (Postgres) de thay compensating transaction da chay that cho don 2.

## payment-service log (that)

```
payment-service consumed event "ORDER_CREATED" for order 2
payment-service payment captured for order 2            # tru tien truoc
payment-service consumed event "INVENTORY_OUT_OF_STOCK" for order 2
payment-service payment refunded for order 2            # compensating transaction
payment-service consumed event "PAYMENT_REFUNDED" for order 2
```

## Bang payments (Postgres) — trang thai REFUNDED

```
psql payments:
 order_id |  status
----------+----------
        1 | CAPTURED
        2 | REFUNDED
```

PASS — cu tru tien `CAPTURED` cua order 2 da duoc hoan lai bang mot local transaction nghich dao (`status = REFUNDED`) tren database payments rieng. Saga khong xoa lich su ma ghi them buoc bu tru; payment van nhat quan trong DB rieng cua minh.
