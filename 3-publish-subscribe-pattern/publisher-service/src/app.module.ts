/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import {
    appConfig,
} from "./config"
/**
 * Module gốc Publisher — đăng ký NATS client và controller REST.
 * (EN: Root Publisher module — registers NATS client and REST controller.)
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
    AppController,
} from "./app.controller"
import {
    AppService,
} from "./app.service"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),
        ClientsModule.register([
            {
                // Token inject cho NATS client.
                // (EN: Injection token for NATS client.)
                name: "NATS_SERVICE",
                transport: Transport.NATS,
                options: {
                    servers: [
                        // Địa chỉ NATS server từ biến môi trường hoặc mặc định.
                        // (EN: NATS server address from env or default.)
                        process.env.NATS_URL || "nats://nats:4222",
                    ],
                },
            },
        ]),
    ],
    controllers: [AppController],
    providers: [AppService],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
