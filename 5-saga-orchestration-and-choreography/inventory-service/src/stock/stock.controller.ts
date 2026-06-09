/**
 * HTTP controller — debug routes delegate to service.
 * (EN: HTTP controller — debug routes delegating to service.)
 */
import {
    Body,
    Controller,
    Get,
    Post,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    ProductEntity,
} from "../entities"
import {
    StockService,
} from "./stock.service"

@Controller()
export class StockController {
    constructor(
        private readonly stock: StockService,
        @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    ) {}

    /**
     * Logic — đọc tồn kho hiện tại (debug).
     * Code — GET /stock → products.find().
     * (EN Logic: Read current stock levels (debug).)
     * (EN Code: GET /stock → products.find().)
     */
    @Get("stock")
    async list(): Promise<ProductEntity[]> {
        return this.products.find()
    }

    /**
     * Logic — gọi thử bước inventory của saga (debug).
     * Code — POST /check → stock.tryFulfill().
     * (EN Logic: Manually trigger the inventory saga step (debug).)
     * (EN Code: POST /check → stock.tryFulfill().)
     */
    @Post("check")
    async check(
        @Body() body: { orderId: number; productId: number; quantity: number },
    ): ReturnType<StockService["tryFulfill"]> {
        return this.stock.tryFulfill(body.orderId, body.productId, body.quantity)
    }
}
