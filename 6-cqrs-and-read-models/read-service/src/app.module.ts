/**
 * Module gốc — ConfigModule + CustomerModule (Elasticsearch + RabbitMQ consumer).
 * Read Service nhận event đồng bộ từ RabbitMQ, index vào Elasticsearch, phục vụ query GET.
 * (EN: Root module — ConfigModule + CustomerModule (Elasticsearch + RabbitMQ consumer).
 * Read Service receives sync events from RabbitMQ, indexes to Elasticsearch, serves GET queries.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    CustomerModule,
} from "./customer"

@Module({
    imports: [
        // Cấu hình toàn cục: đọc env từ Compose hoặc .env local.
        // (EN: Global config: reads env from Compose or local .env.)
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        CustomerModule,
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
