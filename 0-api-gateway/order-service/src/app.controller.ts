import {
    Controller,
    Get,
    Logger,
} from "@nestjs/common"
import {
    AppService,
} from "./app.service"

@Controller("orders")
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    @Get()
    getOrders() {
        this.logger.log("Received request to fetch orders")
        return this.appService.getOrders()
    }
}
