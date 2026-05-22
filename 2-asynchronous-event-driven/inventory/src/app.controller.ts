import {
    Controller,
    Logger,
} from "@nestjs/common"
import {
    EventPattern,
    Payload,
} from "@nestjs/microservices"
import {
    AppService,
} from "./app.service"

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    @EventPattern("order-events")
    handleOrderCreated(@Payload() data: Record<string, unknown>) {
        this.logger.log(`Received ORDER_CREATED event: ${JSON.stringify(data)}`)
        this.appService.updateStock(data)
    }
}
