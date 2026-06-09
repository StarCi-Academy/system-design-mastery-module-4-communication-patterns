/**
 * Module gốc — MongoDB (Mongoose) + InventoryModule.
 * Inventory Service quản lý tồn kho sản phẩm bằng MongoDB,
 * nhận event `order-events` từ Kafka để trừ kho tự động.
 * (EN: Root module — MongoDB (Mongoose) + InventoryModule.
 * Inventory Service manages product stock via MongoDB,
 * receives `order-events` from Kafka to auto-decrement stock.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    MongooseModule,
} from "@nestjs/mongoose"
import {
    InventoryModule,
} from "./inventory"
import {
    appConfig,
} from "./config"

@Module({
    imports: [
        // Cấu hình toàn cục: đọc env từ Compose hoặc .env local.
        // (EN: Global config: reads env from Compose or local .env.)
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),

        // MongoDB — kết nối riêng cho Inventory Service.
        // (EN: MongoDB — dedicated connection for Inventory Service.)
        MongooseModule.forRoot(
            process.env.INVENTORY_MONGO_URI ||
            "mongodb://localhost:27017/inventory_db",
        ),

        InventoryModule,
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
