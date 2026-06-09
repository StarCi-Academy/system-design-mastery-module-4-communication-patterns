# Java — Flow 4: trang thai bu tru cuoi (track 2 service — khong payment REFUNDED)

Body Luong 4 kiem chung payment da REFUNDED. Track Java la choreography RUT GON 2 service (order + inventory), KHONG co payment-service, nen khong co buoc capture/refund. Compensation o track nay = order tu CANCELLED khi nghe INVENTORY_OUT_OF_STOCK. Day la trang thai bu tru cuoi cung tuong duong, kiem chung qua DB.

## Trang thai cuoi cua saga compensation (psql orders)

```
psql orders:
 id | product_id | quantity |  status
----+------------+----------+-----------
  1 |          2 |        1 | COMPLETED      # happy path
  2 |          1 |        1 | CANCELLED      # compensation path
```

## Khong co payment event tren topic (track 2 service)

```
# saga.demo.events chi co ORDER_CREATED / INVENTORY_OK / INVENTORY_OUT_OF_STOCK
# KHONG co PAYMENT_CAPTURED / PAYMENT_REFUNDED (khong co payment-service)
```

PASS — trong track 2 service, buoc bu tru la order tu chuyen `CANCELLED` (local transaction nghich dao tren bang orders) khi nghe `INVENTORY_OUT_OF_STOCK`, thay cho `ROLLBACK` xuyen service. Ban chat compensation giong nhau (ghi them buoc bu tru, moi service nhat quan trong DB rieng); chi khac so service. Track TS + Go co payment-service day du voi PAYMENT_REFUNDED that (xem .e2e/typescript va .e2e/go flow-4).
