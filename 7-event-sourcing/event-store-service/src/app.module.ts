/**
 * Module gốc — PostgreSQL (TypeORM) + AccountModule.
 * Event Store Service: append-only events table, projections by replay, snapshots.
 * (EN: Root module — PostgreSQL (TypeORM) + AccountModule.
 * Event Store Service: append-only events table, projections by replay, snapshots.)
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
    AccountModule,
} from "./account"
import {
    AccountSnapshot,
    EventRecord,
} from "./entities"
import {
    appConfig,
} from "./config"

@Module({
    imports: [
        // Cấu hình toàn cục: đọc env từ Compose hoặc .env local.
        // (EN: Global config: reads env from Compose or local .env.)
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),

        // TypeORM — kết nối PostgreSQL, tự đồng bộ schema khi khởi động (chỉ cho lab/demo).
        // (EN: TypeORM — PostgreSQL connection, auto-sync schema on startup (lab/demo only).)
        TypeOrmModule.forRoot({
            type: "postgres",
            host: process.env["DB_HOST"] || "localhost",
            port: Number(process.env["DB_PORT"] || 5432),
            username: process.env["DB_USER"] || "eventsource",
            password: process.env["DB_PASSWORD"] || "eventsource",
            database: process.env["DB_NAME"] || "event_store",
            entities: [EventRecord, AccountSnapshot],
            // Chỉ dùng synchronize: true cho lab/demo.
            // (EN: Only use synchronize: true for lab/demo.)
            synchronize: true,
            logging: process.env["DB_LOGGING"] === "true",
        }),

        AccountModule,
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
