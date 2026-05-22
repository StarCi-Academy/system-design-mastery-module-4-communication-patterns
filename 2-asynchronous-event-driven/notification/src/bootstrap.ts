/**
 * Khởi tạo Kafka Microservice Notification — consumer nhóm `notification-consumer`.
 * (EN: Bootstrap Kafka Notification Microservice — consumer group `notification-consumer`.)
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

/**
 * Logic — Khởi động Nest app, ValidationPipe, lắng nghe `0.0.0.0` cho Docker.
 * Code — `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 * (EN Logic: Start Nest app with global ValidationPipe and Docker-friendly bind.)
 * (EN Code: `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.KAFKA,
        options: {
            client: {
                // Địa chỉ Kafka broker từ biến môi trường hoặc mặc định.
                // (EN: Kafka broker address from env or default.)
                brokers: [process.env.KAFKA_BROKERS || "kafka:9092"],
            },
            consumer: {
                // Group ID duy nhất cho Notification consumer.
                // (EN: Unique group ID for Notification consumer.)
                groupId: "notification-consumer",
            },
        },
    })
    await app.listen()
}
