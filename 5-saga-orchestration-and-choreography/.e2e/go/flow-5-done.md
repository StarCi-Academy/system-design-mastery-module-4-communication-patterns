# Go — Flow 5: quan sat chuoi event tren Kafka UI / topic saga.demo.events

Kafka UI (http://localhost:8180) soi topic `saga.demo.events`. Doc truc tiep topic + consumer group qua broker.

## Consumer group (proof: KHONG coordinator, moi service mot group)

```
$ kafka-consumer-groups.sh --list
order-service-group
inventory-service-group
payment-service-group
```

## Toan bo message tren topic saga.demo.events (--from-beginning)

```
{"event":"ORDER_CREATED","orderId":1,"productId":2,"quantity":1}
{"event":"PAYMENT_CAPTURED","orderId":1,"productId":2,"quantity":1,"amount":99.99}
{"event":"INVENTORY_OK","orderId":1,"productId":2,"quantity":1}
{"event":"ORDER_CREATED","orderId":2,"productId":1,"quantity":1}
{"event":"PAYMENT_CAPTURED","orderId":2,"productId":1,"quantity":1,"amount":99.99}
{"event":"INVENTORY_OUT_OF_STOCK","orderId":2,"productId":1}
{"event":"PAYMENT_REFUNDED","orderId":2}
```

PASS — moi event cua ca hai saga (happy order 1 + compensation order 2) nam tren MOT topic chung, ba consumer group doc lap cung doc. Day la choreography: khong service "dieu phoi"; toan canh saga chi hien ra khi ghep cac event tren topic lai, khong nam o coordinator nao.
