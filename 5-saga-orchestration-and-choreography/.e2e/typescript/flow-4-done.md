# TypeScript — Flow 4: kiem chung payment da REFUNDED

Doc log payment-service de thay compensating transaction da chay that cho don 2 (don het kho o flow 3).

## payment-service log (that)

```
payment-service  [SagaEventsController]  Consumed event "ORDER_CREATED" for order "2"
payment-service  [KafkaProducerService]  Publishing event "PAYMENT_CAPTURED" for order "2"
payment-service  [PaymentService]        Payment captured for order "2"          # tru tien truoc
payment-service  [SagaEventsController]  Consumed event "INVENTORY_OUT_OF_STOCK" for order "2"
payment-service  [KafkaProducerService]  Publishing event "PAYMENT_REFUNDED" for order "2"
payment-service  [PaymentService]        Refunded order "2"                      # compensating transaction
```

PASS — cu tru tien `CAPTURED` o buoc truoc da duoc hoan lai bang mot local transaction nghich dao (`status: "REFUNDED"`). Saga khong xoa lich su ma ghi them buoc bu tru, moi service van nhat quan trong database rieng cua minh.
