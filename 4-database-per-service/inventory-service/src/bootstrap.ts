/**
 * Khởi tạo Nest app — Inventory Service (Hybrid HTTP + Kafka consumer).
 * HTTP endpoint quản lý tồn kho, Kafka consumer nhận event `order-events`.
 * (EN: Bootstrap Nest app — Inventory Service (Hybrid HTTP + Kafka consumer).
 * HTTP endpoint manages stock, Kafka consumer receives `order-events`.)
 */
import {
    NestFactory,
} from "@nestjs/core"
import {
    ValidationPipe,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
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
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: false,
    }))

    // Kết nối Kafka consumer để nhận event từ Order Service.
    // (EN: Connect Kafka consumer to receive events from Order Service.)
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: "database-per-service-inventory",
                brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
            },
            consumer: {
                groupId: "database-per-service-inventory",
            },
        },
    })
    await app.startAllMicroservices()

    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    // Cổng lắng nghe: env PORT hoặc mặc định 3002.
    // (EN: Listen port from env PORT or default 3002.)
    await app.listen(port, "0.0.0.0")
}
