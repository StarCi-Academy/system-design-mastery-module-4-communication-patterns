import {
    Body,
    Controller,
    Logger,
    Post,
} from "@nestjs/common"
import {
    AppService,
} from "./app.service"

@Controller("orders")
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    @Post()
    async createOrder(@Body() orderData: Record<string, unknown>) {
        this.logger.log("Received request to create order")
        return this.appService.createOrder(orderData)
    }
}
