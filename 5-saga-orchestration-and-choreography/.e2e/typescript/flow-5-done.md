# TypeScript — Flow 5: quan sat chuoi event tren Kafka UI / topic saga.demo.events

Kafka UI (http://localhost:8080) soi topic `saga.demo.events`. Doc truc tiep topic + consumer group qua broker de capture noi dung that ma UI hien.

## Topic + consumer group (proof: KHONG coordinator, moi service mot group)

```
$ kafka-topics.sh --list
__consumer_offsets
saga.demo.events

$ kafka-consumer-groups.sh --list
payment-service-group-server
inventory-service-group-server
order-service-group-server
nestjs-group-client
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

PASS — moi event cua ca hai saga (happy order 1 + compensation order 2) nam tren MOT topic chung, nhieu consumer group cung doc. Day la choreography: khong service "dieu phoi"; moi service tu dang ky consume topic va tu quyet phan ung. Toan canh saga chi hien ra khi ghep cac event lai, khong nam o mot coordinator nao.
