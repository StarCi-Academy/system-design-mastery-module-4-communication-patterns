/**
 * Feature module quản lý tồn kho — Mongoose schema + Kafka event handler.
 * (EN: Inventory feature module — Mongoose schema + Kafka event handler.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    MongooseModule,
} from "@nestjs/mongoose"
import {
    Product,
    ProductSchema,
} from "../schemas"
import {
    InventoryService,
} from "./inventory.service"
import {
    InventoryController,
} from "./inventory.controller"
import {
    OrderEventsController,
} from "./order-events.controller"

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    ],
    controllers: [InventoryController, OrderEventsController],
    providers: [InventoryService],
})
/**
 * Class `InventoryModule` — thành phần lab (controller/service/module).
 * (EN: Class `InventoryModule` — lesson lab component.)
 */
export class InventoryModule {}
