/**
 * Khởi tạo Nest app — Order Service (HTTP producer).
 * Lắng nghe REST request tạo đơn hàng, lưu PostgreSQL, emit Kafka event.
 * (EN: Bootstrap Nest app — Order Service (HTTP producer).
 * Listens for REST requests to create orders, persists to PostgreSQL, emits Kafka events.)
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
    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    // Cổng lắng nghe: env PORT hoặc mặc định 3001.
    // (EN: Listen port from env PORT or default 3001.)
    await app.listen(port, "0.0.0.0")
}
