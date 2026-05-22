/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import {
    appConfig,
} from "./config"
/**
 * Module gốc Order — đăng ký Kafka producer client và controller REST.
 * (EN: Root Order module — registers Kafka producer client and REST controller.)
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
                // Token inject cho Kafka producer client.
                // (EN: Injection token for Kafka producer client.)
                name: "KAFKA_SERVICE",
                transport: Transport.KAFKA,
                options: {
                    client: {
                        // Địa chỉ Kafka broker từ biến môi trường hoặc mặc định.
                        // (EN: Kafka broker address from env or default.)
                        brokers: [process.env.KAFKA_BROKERS || "kafka:9092"],
                    },
                    producer: {
                        // Tự tạo topic nếu chưa tồn tại (dev only).
                        // (EN: Auto-create topic if not exists (dev only).)
                        allowAutoTopicCreation: true,
                    },
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
