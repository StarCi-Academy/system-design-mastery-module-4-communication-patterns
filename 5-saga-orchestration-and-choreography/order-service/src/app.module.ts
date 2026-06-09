/**
 * Module gốc — SQLite (TypeORM) + OrdersModule + Saga Kafka bus.
 * Order Service tạo đơn hàng lưu SQLite, orchestrate saga qua Kafka.
 * (EN: Root module — SQLite (TypeORM) + OrdersModule + Saga Kafka bus.
 * Order Service creates orders in SQLite, orchestrates saga via Kafka.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    OrderEntity,
} from "./entities"
import {
    OrdersModule,
} from "./orders"

@Module({
    imports: [
        // Cấu hình toàn cục: đọc env từ Compose hoặc .env local.
        // (EN: Global config: reads env from Compose or local .env.)
        ConfigModule.forRoot({ isGlobal: true }),

        // SQLite — lightweight database cho demo saga.
        // (EN: SQLite — lightweight database for saga demo.)
        TypeOrmModule.forRoot({
            type: "sqlite",
            database: process.env.ORDER_SQLITE_PATH || "order.sqlite",
            entities: [OrderEntity],
            // Chỉ dùng synchronize: true cho lab/demo.
            // (EN: Only use synchronize: true for lab/demo.)
            synchronize: true,
        }),

        OrdersModule,
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
