/**
 * Khởi tạo Nest app Order Producer — REST API nhận POST /orders, emit Kafka event.
 * (EN: Bootstrap Order Producer Nest app — REST API for POST /orders, emits Kafka event.)
 */
import {
    ValidationPipe,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    NestFactory,
} from "@nestjs/core"
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
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidUnknownValues: false,
        }),
    )
    // Cổng: ConfigService namespace app.port (từ app.config.ts).
    // (EN: Port from ConfigService app.port (via app.config.ts).)
    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    await app.listen(
        port,
        // Lắng nghe trên mọi interface để container map được cổng.
        // (EN: Listen on all interfaces so Docker port mapping works.)
        "0.0.0.0",
    )
}
