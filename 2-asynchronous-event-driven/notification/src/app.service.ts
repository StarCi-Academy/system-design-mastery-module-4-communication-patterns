/**
 * Service Notification — xử lý logic gửi thông báo push sau khi nhận event.
 * (EN: Notification Service — handles push notification logic after receiving event.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /**
     * Logic — gửi push notification cho user (mock, chỉ log).
     * Code — nhận payload chứa `orderId`, log ra console.
     * (EN Logic: Sends push notification to user (mock, log only).)
     * (EN Code: Receives payload with `orderId`, logs to console.)
     */
    sendNotification(data: { orderId: number; productName: string; quantity: number }): void {
        // Mock notification send — log the action; replace with real push service in production
        this.logger.log(`Sending notification for order ${data.orderId}...`)
    }
}
