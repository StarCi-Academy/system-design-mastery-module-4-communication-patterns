/**
 * Khởi tạo Nest app — Saga Inventory Service (Hybrid HTTP + Kafka consumer).
 * Kiểm tra tồn kho, emit INVENTORY_OK hoặc INVENTORY_OUT_OF_STOCK.
 * (EN: Bootstrap Nest app — Saga Inventory Service (Hybrid HTTP + Kafka consumer).
 * Checks stock, emits INVENTORY_OK or INVENTORY_OUT_OF_STOCK.)
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
    INVENTORY_SERVICE_CONSUMER_GROUP,
} from "./saga"

/**
 * Logic — Khởi động Nest app, ValidationPipe, lắng nghe `0.0.0.0` cho Docker.
 * Code — `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 * (EN Logic: Start Nest app with global ValidationPipe and Docker-friendly bind.)
 * (EN Code: `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)

    // Kết nối Kafka consumer để nhận event saga (PAYMENT_CAPTURED).
    // (EN: Connect Kafka consumer to receive saga events (PAYMENT_CAPTURED).)
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: "inventory-service-consumer",
                brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
            },
            consumer: {
                groupId: INVENTORY_SERVICE_CONSUMER_GROUP,
            },
        },
    })
    await app.startAllMicroservices()

    // Cổng lắng nghe: env PORT hoặc mặc định 3003.
    // (EN: Listen port from env PORT or default 3003.)
    const port = Number(process.env.PORT) || 3003
    await app.listen(port, "0.0.0.0")
}
