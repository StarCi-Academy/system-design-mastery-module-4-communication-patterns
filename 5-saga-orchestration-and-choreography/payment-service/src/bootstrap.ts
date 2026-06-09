/**
 * Khởi tạo Nest app — Saga Payment Service (Hybrid HTTP + Kafka consumer).
 * Xử lý thanh toán, emit PAYMENT_CAPTURED hoặc PAYMENT_REFUNDED.
 * (EN: Bootstrap Nest app — Saga Payment Service (Hybrid HTTP + Kafka consumer).
 * Processes payment, emits PAYMENT_CAPTURED or PAYMENT_REFUNDED.)
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
    PAYMENT_SERVICE_CONSUMER_GROUP,
} from "./saga"

/**
 * Logic — Khởi động Nest app, ValidationPipe, lắng nghe `0.0.0.0` cho Docker.
 * Code — `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 * (EN Logic: Start Nest app with global ValidationPipe and Docker-friendly bind.)
 * (EN Code: `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)

    // Kết nối Kafka consumer để nhận event saga (ORDER_CREATED).
    // (EN: Connect Kafka consumer to receive saga events (ORDER_CREATED).)
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: "payment-service-consumer",
                brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
            },
            consumer: {
                groupId: PAYMENT_SERVICE_CONSUMER_GROUP,
            },
        },
    })
    await app.startAllMicroservices()

    // Cổng lắng nghe: env PORT hoặc mặc định 3002.
    // (EN: Listen port from env PORT or default 3002.)
    const port = Number(process.env.PORT) || 3002
    await app.listen(port, "0.0.0.0")
}
