/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import {
    appConfig,
} from "./config"
/**
 * Module gốc — đăng ký 2 gRPC client (User, Product) và controller REST gateway.
 * (EN: Root module — registers 2 gRPC clients (User, Product) and the REST gateway controller.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    ClientsModule,
    Transport,
} from "@nestjs/microservices"
import {
    join,
} from "path"
import {
    AppController,
} from "./app.controller"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),
        ClientsModule.register([
            {
                // Token inject cho User gRPC client.
                // (EN: Injection token for User gRPC client.)
                name: "USER_SERVICE",
                transport: Transport.GRPC,
                options: {
                    package: "user",
                    protoPath: join(__dirname, "..", "proto", "user.proto"),
                    url: process.env.USER_GRPC_URL || "user-service:5001",
                },
            },
            {
                // Token inject cho Product gRPC client.
                // (EN: Injection token for Product gRPC client.)
                name: "PRODUCT_SERVICE",
                transport: Transport.GRPC,
                options: {
                    package: "product",
                    protoPath: join(__dirname, "..", "proto", "product.proto"),
                    url: process.env.PRODUCT_GRPC_URL || "product-service:5002",
                },
            },
        ]),
    ],
    controllers: [AppController],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
