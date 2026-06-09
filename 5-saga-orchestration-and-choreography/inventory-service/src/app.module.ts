/**
 * Module gốc — SQLite (TypeORM) + StockModule + Saga Kafka consumer.
 * Inventory Service quản lý tồn kho, kiểm tra stock khi nhận event PAYMENT_CAPTURED.
 * (EN: Root module — SQLite (TypeORM) + StockModule + Saga Kafka consumer.
 * Inventory Service manages stock, checks availability on PAYMENT_CAPTURED events.)
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
    FulfillmentEntity,
} from "./entities"
import {
    ProductEntity,
} from "./entities"
import {
    StockModule,
} from "./stock"

@Module({
    imports: [
        // Cấu hình toàn cục: đọc env từ Compose hoặc .env local.
        // (EN: Global config: reads env from Compose or local .env.)
        ConfigModule.forRoot({ isGlobal: true }),

        // SQLite — lightweight database cho demo saga.
        // (EN: SQLite — lightweight database for saga demo.)
        TypeOrmModule.forRoot({
            type: "sqlite",
            database: process.env.INVENTORY_SQLITE_PATH || "inventory.sqlite",
            entities: [ProductEntity, FulfillmentEntity],
            // Chỉ dùng synchronize: true cho lab/demo.
            // (EN: Only use synchronize: true for lab/demo.)
            synchronize: true,
        }),

        StockModule,
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
