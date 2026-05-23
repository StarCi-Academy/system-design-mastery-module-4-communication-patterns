# Slot 3 lesson 2 async event-driven — re-verify 2026-05-23

Flow 1 create order: PASS — 201 {"message":"Order Created","orderId":18526,"status":"Pending"}.
Flow 2 fanout consumers: PASS — both inventory-service and notification-service logged `Received ORDER_CREATED event: {"orderId":18526,...}` and their respective downstream actions.
Flow 3 topic + lag: PASS — kafka-topics.sh listed order-events; kafka-consumer-groups.sh --describe inventory-consumer-server shows CURRENT-OFFSET=1 LOG-END-OFFSET=1 LAG=0.

3/3 PASS, 0 retries.
