/**
 * Khởi tạo NATS Microservice Analytics — lắng nghe event `app.events`.
 * (EN: Bootstrap NATS Analytics Microservice — listens on `app.events`.)
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
        transport: Transport.NATS,
        options: {
            servers: [
                // Địa chỉ NATS server từ biến môi trường hoặc mặc định.
                // (EN: NATS server address from env or default.)
                process.env.NATS_URL || "nats://nats:4222",
            ],
        },
    })
    await app.listen()
}
