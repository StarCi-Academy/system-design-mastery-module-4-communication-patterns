/**
 * Khởi tạo Nest app — Saga Order Service (Hybrid HTTP + Kafka consumer).
 * REST API tạo đơn hàng, Kafka consumer nhận kết quả saga (INVENTORY_OK / PAYMENT_REFUNDED).
 * (EN: Bootstrap Nest app — Saga Order Service (Hybrid HTTP + Kafka consumer).
 * REST API creates orders, Kafka consumer receives saga results (INVENTORY_OK / PAYMENT_REFUNDED).)
 */
import {
    NestFactory,
} from "@nestjs/core"
import {
    MicroserviceOptions,
    Transport,
} from "@nestjs/microservices"
import {
    AppModule,
} from "./app.module"
import {
    ORDER_SERVICE_CONSUMER_GROUP,
} from "./saga"

/**
 * Logic — Khởi động Nest app, ValidationPipe, lắng nghe `0.0.0.0` cho Docker.
 * Code — `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 * (EN Logic: Start Nest app with global ValidationPipe and Docker-friendly bind.)
 * (EN Code: `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)

    // Kết nối Kafka consumer để nhận kết quả saga.
    // (EN: Connect Kafka consumer to receive saga results.)
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: "order-service-consumer",
                brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
            },
            consumer: {
                groupId: ORDER_SERVICE_CONSUMER_GROUP,
            },
        },
    })
    await app.startAllMicroservices()

    // Cổng lắng nghe: env PORT hoặc mặc định 3001.
    // (EN: Listen port from env PORT or default 3001.)
    const port = Number(process.env.PORT) || 3001
    await app.listen(port, "0.0.0.0")
}
