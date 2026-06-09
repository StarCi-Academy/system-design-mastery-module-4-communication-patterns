/**
 * Kafka controller — listens to `order-events` topic for the Notification consumer.
 * (EN: Kafka controller — listens to `order-events` topic for the Notification consumer.)
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
     * Logic — nhận event `order-events` từ Kafka, gọi service gửi thông báo.
     * Code — `@EventPattern` lắng nghe topic, `@Payload()` trích payload message.
     * (EN Logic: Receives `order-events` from Kafka, calls service to send notification.)
     * (EN Code: `@EventPattern` listens on topic, `@Payload()` extracts message payload.)
     */
    @EventPattern("order-events")
    handleOrderCreated(@Payload() data: { orderId: number; productName: string; quantity: number }): void {
        this.logger.log(`Received ORDER_CREATED: order ${data.orderId} (${data.productName} x${data.quantity})`)
        this.appService.sendNotification(data)
    }
}
