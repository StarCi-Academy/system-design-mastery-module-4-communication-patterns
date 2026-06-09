/**
 * Module gốc — SQLite (TypeORM) + LedgerModule + Saga Kafka consumer.
 * Payment Service xử lý thanh toán, emit PAYMENT_CAPTURED hoặc PAYMENT_REFUNDED.
 * (EN: Root module — SQLite (TypeORM) + LedgerModule + Saga Kafka consumer.
 * Payment Service processes payment, emits PAYMENT_CAPTURED or PAYMENT_REFUNDED.)
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
    PaymentEntity,
} from "./entities"
import {
    LedgerModule,
} from "./ledger"

@Module({
    imports: [
        // Cấu hình toàn cục: đọc env từ Compose hoặc .env local.
        // (EN: Global config: reads env from Compose or local .env.)
        ConfigModule.forRoot({ isGlobal: true }),

        // SQLite — lightweight database cho demo saga.
        // (EN: SQLite — lightweight database for saga demo.)
        TypeOrmModule.forRoot({
            type: "sqlite",
            database: process.env.PAYMENT_SQLITE_PATH || "payment.sqlite",
            entities: [PaymentEntity],
            // Chỉ dùng synchronize: true cho lab/demo.
            // (EN: Only use synchronize: true for lab/demo.)
            synchronize: true,
        }),

        LedgerModule,
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule { }
