/**
 * Khởi tạo Nest app — CQRS Read Service (Query side + RabbitMQ consumer).
 * Hybrid app: HTTP GET query từ Elasticsearch + RMQ microservice nhận event đồng bộ.
 * (EN: Bootstrap Nest app — CQRS Read Service (Query side + RabbitMQ consumer).
 * Hybrid app: HTTP GET queries from Elasticsearch + RMQ microservice receiving sync events.)
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
import {
    buildReadServiceRmqMicroserviceOptions,
} from "./read-service-rmq-microservice.config"

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

    // Hybrid app: kết nối RabbitMQ consumer để nhận event từ Write Service.
    // (EN: Hybrid app: connect RabbitMQ consumer to receive events from Write Service.)
    app.connectMicroservice(buildReadServiceRmqMicroserviceOptions())

    await app.startAllMicroservices()
    const configService = app.get(ConfigService)
    // Cổng lắng nghe: env PORT hoặc mặc định 3001.
    // (EN: Listen port from env PORT or default 3001.)
    const port =
        configService.get<number>("app.port") ??
        (Number(process.env.PORT) || 3001)
    await app.listen(port, "0.0.0.0")
}
