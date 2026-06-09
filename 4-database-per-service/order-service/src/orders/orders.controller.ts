/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
import {
    Body,
    Controller,
    Post,
} from "@nestjs/common"
import {
    OrdersService,
} from "./orders.service"

@Controller("orders")
/**
 * Class `OrdersController` — thành phần lab (controller/service/module).
 * (EN: Class `OrdersController` — lesson lab component.)
 */
export class OrdersController {
    constructor(private readonly orders: OrdersService) {}

    /**
     * Logic — nhận thông tin đơn hàng từ client, trả về order đã lưu.
     * Code — `@Post()` → `this.orders.create(customerId, totalAmount, productName, quantity)`.
     * (EN Logic: Receives order info from client, returns persisted order.)
     * (EN Code: `@Post()` → `this.orders.create(customerId, totalAmount, productName, quantity)`.)
     */
    @Post()
    async create(
        @Body()
        body: {
            customerId: string
            totalAmount: number
            productName?: string
            quantity?: number
        },
    ): Promise<ReturnType<OrdersService["create"]>> {
        return this.orders.create(
            body.customerId,
            body.totalAmount,
            body.productName,
            body.quantity,
        )
    }
}
