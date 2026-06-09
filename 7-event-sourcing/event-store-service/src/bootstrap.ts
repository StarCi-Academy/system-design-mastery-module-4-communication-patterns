/**
 * Khởi tạo Nest app — Event Store Service.
 * Nhận lệnh POST để append event vào Postgres, trả projection qua GET.
 * (EN: Bootstrap Nest app — Event Store Service.
 * Accepts POST commands to append events to Postgres, returns projection via GET.)
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
    // Cổng lắng nghe: env PORT hoặc mặc định 3000.
    // (EN: Listen port from env PORT or default 3000.)
    await app.listen(port, "0.0.0.0")
}
