/**
 * Service Order — dữ liệu mock order trong bộ nhớ (không cần DB).
 * (EN: Order Service — mock order data in memory (no DB required).)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

export type Order = { id: number; product: string; quantity: number; total: number }

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /**
     * Logic — trả mock data order để kiểm thử Kong Gateway routing.
     * Code — trả mảng Order[] hardcoded.
     * (EN Logic: Returns mock order data for Kong Gateway routing test.)
     * (EN Code: Returns hardcoded Order[] array.)
     */
    getOrders(): Order[] {
        this.logger.log("Fetching orders from memory")
        return [
            { id: 1001, product: "Laptop", quantity: 1, total: 1500 },
            { id: 1002, product: "Smartphone", quantity: 2, total: 1600 },
        ]
    }
}
