/**
 * Module gốc — PostgreSQL (TypeORM) + Kafka producer + OrdersModule.
 * Order Service lưu đơn hàng vào PostgreSQL, sau đó emit event `order-events` lên Kafka.
 * (EN: Root module — PostgreSQL (TypeORM) + Kafka producer + OrdersModule.
 * Order Service persists orders to PostgreSQL, then emits `order-events` to Kafka.)
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
    Order,
} from "./entities"
import {
    OrdersModule,
} from "./orders"
import {
    appConfig,
} from "./config"

@Module({
    imports: [
        // Cấu hình toàn cục: đọc env từ Compose hoặc .env local.
        // (EN: Global config: reads env from Compose or local .env.)
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
        // TypeORM — kết nối PostgreSQL riêng cho Order Service.
        // (EN: TypeORM — dedicated PostgreSQL connection for Order Service.)
        TypeOrmModule.forRoot({
            type: "postgres",
            host: process.env.ORDER_DB_HOST || "localhost",
            port: Number(process.env.ORDER_DB_PORT || 5432),
            username: process.env.ORDER_DB_USER || "order",
            password: process.env.ORDER_DB_PASSWORD || "order",
            database: process.env.ORDER_DB_NAME || "order_db",
            entities: [Order],
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
export class AppModule { }
