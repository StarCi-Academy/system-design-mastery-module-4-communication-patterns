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
import type {
    AppEventEnvelope,
} from "./types"

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    @EventPattern("app.events")
    handle(@Payload() data: AppEventEnvelope): void {
        this.logger.log(`analytics: ${JSON.stringify(data)}`)
        this.appService.processEvent(data)
    }
}
