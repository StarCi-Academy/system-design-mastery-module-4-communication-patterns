/**
 * Kafka consumer — nhận `order-events` và trừ kho qua InventoryService.
 * (EN: Kafka consumer — handles `order-events` and decrements stock via InventoryService.)
 */
import {
    Controller,
    Logger,
} from "@nestjs/common"
import {
    EventPattern,
    Payload,
} from "@nestjs/microservices"
import type {
    OrderEventPayload,
} from "../types"
import {
    InventoryService,
} from "./inventory.service"

@Controller()
/**
 * Class `OrderEventsController` — thành phần lab (controller/service/module).
 * (EN: Class `OrderEventsController` — lesson lab component.)
 */
export class OrderEventsController {
    private readonly logger = new Logger(OrderEventsController.name)

    constructor(private readonly inventory: InventoryService) {}

    /**
     * Logic — khi Order Service emit event, trừ kho sản phẩm nếu có thông tin hợp lệ.
     * Code — `@EventPattern("order-events")` → kiểm tra `productName` + `quantity` → gọi `decrementStockByProductName`.
     * (EN Logic: When Order Service emits an event, decrement product stock if valid info provided.)
     * (EN Code: `@EventPattern("order-events")` → check `productName` + `quantity` → call `decrementStockByProductName`.)
     */
    @EventPattern("order-events")
    async onOrder(@Payload() data: OrderEventPayload): Promise<void> {
        this.logger.log(`Received "order-events" payload: ${JSON.stringify(data)}`)
        const productName =
            typeof data.productName === "string" ? data.productName : null
        const quantity = typeof data.quantity === "number" ? data.quantity : null
        if (productName && quantity != null && quantity > 0) {
            await this.inventory.decrementStockByProductName(productName,
                quantity)
        }
    }
}
