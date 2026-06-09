/**
 * Service Product — dữ liệu mock product trong bộ nhớ cho gRPC backend.
 * (EN: Product Service — mock product data in memory for gRPC backend.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

export interface Product {
    id: number
    name: string
    price: number
}

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    private readonly products: Product[] = [
        { id: 1, name: "Course A", price: 99.0 },
        { id: 2, name: "Course B", price: 149.0 },
    ]

    /**
     * Logic — tra cứu product theo ID, trả default nếu không tìm thấy.
     * Code — `Array.find()` trên mảng hardcoded, fallback `{ id: 0 }`.
     * (EN Logic: Looks up product by ID, returns default if not found.)
     * (EN Code: `Array.find()` on hardcoded array, fallback `{ id: 0 }`.)
     */
    getProduct(id: number): Product {
        this.logger.log(`Fetching product from memory for id: ${id}`)
        return this.products.find(p => p.id === id) || { id: 0, name: "Not Found", price: 0 }
    }
}
