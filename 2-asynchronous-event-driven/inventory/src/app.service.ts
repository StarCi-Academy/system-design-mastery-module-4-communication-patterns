/**
 * Service Inventory — xử lý logic cập nhật tồn kho sau khi nhận event.
 * (EN: Inventory Service — handles stock update logic after receiving event.)
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
     * Logic — giảm tồn kho cho product trong đơn hàng (mock, chỉ log).
     * Code — nhận payload chứa `productName` + `quantity`, log ra console.
     * (EN Logic: Decrements stock for product in order (mock, log only).)
     * (EN Code: Receives payload with `productName` + `quantity`, logs to console.)
     */
    updateStock(data: { orderId: number; productName: string; quantity: number }): void {
        // Mock stock decrement — log the action; replace with real DB write in production
        this.logger.log(`Decrementing stock for "${data.productName}" by ${data.quantity}...`)
    }
}
