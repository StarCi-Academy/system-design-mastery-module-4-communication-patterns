import {
    Controller,
    Get,
    Logger,
} from "@nestjs/common"
import {
    AppService,
} from "./app.service"

@Controller("products")
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    @Get()
    getProducts() {
        this.logger.log("Received request to fetch products")
        return this.appService.getProducts()
    }
}
