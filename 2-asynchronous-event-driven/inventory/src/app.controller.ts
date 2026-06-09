/**
 * Kafka controller — listens to `order-events` topic for the Inventory consumer.
 * (EN: Kafka controller — listens to `order-events` topic for the Inventory consumer.)
 */
import {
    Controller,
    Logger,
} from "@nestjs/common"
import {
    EventPattern,
    Payload,
} from "@nestjs/microservices"
import {
    AppService,
} from "./app.service"

@Controller()
/**
 * Class `AppController` — thành phần lab (controller/service/module).
 * (EN: Class `AppController` — lesson lab component.)
 */
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    /**
     * Logic — nhận event `order-events` từ Kafka, gọi service cập nhật tồn kho.
     * Code — `@EventPattern` lắng nghe topic, `@Payload()` trích payload message.
     * (EN Logic: Receives `order-events` from Kafka, calls service to update stock.)
     * (EN Code: `@EventPattern` listens on topic, `@Payload()` extracts message payload.)
     */
    @EventPattern("order-events")
    handleOrderCreated(@Payload() data: { orderId: number; productName: string; quantity: number }): void {
        this.logger.log(`Received ORDER_CREATED: order ${data.orderId} (${data.productName} x${data.quantity})`)
        this.appService.updateStock(data)
    }
}
