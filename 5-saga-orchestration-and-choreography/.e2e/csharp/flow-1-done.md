# C# — Flow 1: tao don du kho (happy path) -> order COMPLETED

C# track (ASP.NET minimal API + Confluent.Kafka). 2 service: order (PostgreSQL/EF Core) + inventory (MongoDB) — choreography rut gon, KHONG co payment-service (inventory phan ung truc tiep voi ORDER_CREATED). Mot topic Kafka `saga.demo.events`. Host port: order 4001, inventory 4003, Kafka UI 8081, Postgres 5433, Mongo 27018.

## Seed ban dau

```
inventory seed: product 1 stock 0, product 2 stock 50
```

## Trigger — POST /order product 2, qty 1

```
POST http://localhost:4001/order  -d {"productId":2,"quantity":1}

-> {"id":1,"productId":2,"quantity":1,"status":"PENDING"}
```

## Lan truyen saga (log .NET that, 2 service)

```
order-service     Consumed saga event ORDER_CREATED for order 1
inventory-service Consumed saga event ORDER_CREATED for order 1
inventory-service Fulfilled order 1
order-service     Consumed saga event INVENTORY_OK for order 1
order-service     Order 1 transitioned to COMPLETED
```

## Ket qua — stock 50->49, order COMPLETED

```
mongo inventory.products: [{"_id":1,"Stock":0},{"_id":2,"Stock":49}]    # 50 - 1 = 49
psql orders: Id=1 ProductId=2 Quantity=1 Status=COMPLETED
```

PASS — saga 2 service: inventory phan ung truc tiep `ORDER_CREATED` -> `INVENTORY_OK` -> order COMPLETED, bat dong bo qua Kafka. Order (Postgres) va inventory (Mongo) moi ben commit local transaction trong DB rieng, khong 2PC. Choreography (khong coordinator).

> Luu y cold-start: C# consumer (Confluent.Kafka) khoi dong truoc khi topic ton tai bao loi "Unknown topic or partition" o vai giay dau; ConsumeLoop catch exception + tiep tuc vong lap, nen TU PHUC HOI ngay khi POST /order dau tien tao topic. Khong can restart tay.
