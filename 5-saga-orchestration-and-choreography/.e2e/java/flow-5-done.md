# Java — Flow 5: quan sat chuoi event tren Kafka UI / topic saga.demo.events

Kafka UI (http://localhost:8180) soi topic `saga.demo.events`. Doc truc tiep topic + consumer group qua broker.

## Consumer group (proof: KHONG coordinator, moi service mot group)

```
$ kafka-consumer-groups.sh --list
order-service-group
inventory-service-group
```

## Toan bo message tren topic saga.demo.events (--from-beginning)

```
{"quantity":1,"productId":2,"orderId":1,"event":"ORDER_CREATED"}
{"quantity":1,"productId":2,"orderId":1,"event":"INVENTORY_OK"}
{"quantity":1,"productId":1,"orderId":2,"event":"ORDER_CREATED"}
{"productId":1,"orderId":2,"event":"INVENTORY_OUT_OF_STOCK"}
```

PASS — moi event cua ca hai saga (happy order 1 + compensation order 2) nam tren MOT topic chung, hai consumer group doc lap (order + inventory) cung doc. Day la choreography 2 service: khong coordinator; toan canh saga chi hien ra khi ghep cac event tren topic lai. (Track nay khong co PAYMENT_* event vi khong co payment-service.)
