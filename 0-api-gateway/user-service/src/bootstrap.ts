/**
 * Khởi tạo Nest app User Service — ValidationPipe toàn cục và lắng nghe cổng.
 * (EN: Bootstrap Nest User Service app — global ValidationPipe and listen on port.)
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
    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    // Cổng: ConfigService namespace app.port (từ app.config.ts).
    // (EN: Port from ConfigService app.port (via app.config.ts).)
    await app.listen(
        port,
        // Lắng nghe trên mọi interface để container/docker map được cổng.
        // (EN: Listen on all interfaces so Docker/port mapping works.)
        "0.0.0.0",
    )
}
