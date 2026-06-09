/**
 * HTTP controller — REST endpoints for the Order producer service.
 * (EN: HTTP controller — REST endpoints for the Order producer service.)
 */
import {
    Body,
    Controller,
    Get,
    Logger,
    Post,
} from "@nestjs/common"
import {
    AppService,
} from "./app.service"

@Controller("orders")
/**
 * Class `AppController` — thành phần lab (controller/service/module).
 * (EN: Class `AppController` — lesson lab component.)
 */
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    /**
     * Logic — nhận POST /orders từ client, gọi service tạo đơn + emit event.
     * Code — `@Post()` map REST endpoint, uỷ thác logic cho `AppService.createOrder`.
     * (EN Logic: Receives POST /orders from client, calls service to create order + emit event.)
     * (EN Code: `@Post()` maps REST endpoint, delegates to `AppService.createOrder`.)
     */
    @Post()
    async createOrder(@Body() orderData: { productName: string; quantity: number }) {
        this.logger.log("Received request to create order")
        return this.appService.createOrder(orderData)
    }

    /**
     * Logic — liệt kê tất cả đơn hàng trong bộ nhớ.
     * Code — `@Get()` map REST endpoint, uỷ thác cho `AppService.getOrders`.
     * (EN Logic: Lists all in-memory orders.)
     * (EN Code: `@Get()` maps REST endpoint, delegates to `AppService.getOrders`.)
     */
    @Get()
    getOrders() {
        return this.appService.getOrders()
    }
}
