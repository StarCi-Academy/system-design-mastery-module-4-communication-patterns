/**
 * Module gốc — PostgreSQL (TypeORM) + CqrsModule + RabbitMQ publisher + CustomerModule.
 * Write Service lưu customer vào PostgreSQL (Write Model), emit event qua RabbitMQ để đồng bộ Read Model.
 * (EN: Root module — PostgreSQL (TypeORM) + CqrsModule + RabbitMQ publisher + CustomerModule.
 * Write Service persists customers to PostgreSQL (Write Model), emits events via RabbitMQ to sync Read Model.)
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
    CustomerModule,
} from "./customer"
import {
    Customer,
} from "./entities"

@Module({
    imports: [
        // Cấu hình toàn cục: đọc env từ Compose hoặc .env local.
        // (EN: Global config: reads env from Compose or local .env.)
        ConfigModule.forRoot({
            isGlobal: true,
        }),

        // TypeORM — kết nối PostgreSQL riêng cho Write Model.
        // (EN: TypeORM — dedicated PostgreSQL connection for Write Model.)
        TypeOrmModule.forRoot({
            type: "postgres",
            host: process.env.WRITE_DB_HOST || "localhost",
            port: Number(process.env.WRITE_DB_PORT || 5432),
            username: process.env.WRITE_DB_USER || "cqrs",
            password: process.env.WRITE_DB_PASSWORD || "cqrs",
            database: process.env.WRITE_DB_NAME || "cqrs_write",
            entities: [Customer],
            // Chỉ dùng synchronize: true cho lab/demo.
            // (EN: Only use synchronize: true for lab/demo.)
            synchronize: true,
        }),

        CustomerModule,
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
