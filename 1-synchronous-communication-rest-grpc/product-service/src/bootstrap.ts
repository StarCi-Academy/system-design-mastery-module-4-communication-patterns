/**
 * Khởi tạo gRPC Microservice Product — lắng nghe trên cổng 5002.
 * (EN: Bootstrap gRPC Product Microservice — listens on port 5002.)
 */
import {
    NestFactory,
} from "@nestjs/core"
import {
    MicroserviceOptions,
    Transport,
} from "@nestjs/microservices"
import {
    join,
} from "path"
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
        transport: Transport.GRPC,
        options: {
            // Package khớp với `package product;` trong `product.proto`.
            // (EN: Package matches `package product;` in `product.proto`.)
            package: "product",
            protoPath: join(__dirname, "../.proto/product.proto"),
            // Lắng nghe trên mọi interface để container map được cổng.
            // (EN: Listen on all interfaces so Docker port mapping works.)
            url: "0.0.0.0:5002",
        },
    })
    await app.listen()
}
