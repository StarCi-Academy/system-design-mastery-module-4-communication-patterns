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
     * Code — nhận payload chứa `productId`, log ra console.
     * (EN Logic: Decrements stock for product in order (mock, log only).)
     * (EN Code: Receives payload with `productId`, logs to console.)
     */
    updateStock(data) {
        this.logger.log(`Updating stock for product ${data.productId}...`)
    }
}
