/**
 * Service Product — dữ liệu mock product trong bộ nhớ (không cần DB).
 * (EN: Product Service — mock product data in memory (no DB required).)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

export type Product = { id: number; name: string; price: number }

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /**
     * Logic — trả mock data product để kiểm thử Kong Gateway routing.
     * Code — trả mảng Product[] hardcoded.
     * (EN Logic: Returns mock product data for Kong Gateway routing test.)
     * (EN Code: Returns hardcoded Product[] array.)
     */
    getProducts(): Product[] {
        this.logger.log("Fetching products from memory")
        return [
            { id: 101, name: "Laptop", price: 1500 },
            { id: 102, name: "Smartphone", price: 800 },
        ]
    }
}
