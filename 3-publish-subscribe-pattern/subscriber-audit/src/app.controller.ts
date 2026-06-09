/**
 * NATS microservice controller — listens on `app.events` subject.
 * (EN: NATS microservice controller — listens on `app.events` subject.)
 */
import {
    Controller,
    Logger,
} from "@nestjs/common"
import {
    EventPattern,
    Payload,
} from "@nestjs/microservices"
import type {
    AppEventEnvelope,
} from "./types"
import {
    AppService,
} from "./app.service"

/**
 * Class `AppController` — NATS event listener for audit subscriber.
 * (EN: Class `AppController` — NATS event listener for audit subscriber.)
 */
@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    /**
     * Logic — nhận event `app.events`, gọi service ghi audit log.
     * Code — `@EventPattern` lắng nghe NATS subject, `@Payload()` trích data.
     * (EN Logic: Receives `app.events`, calls service to write audit log.)
     * (EN Code: `@EventPattern` listens on NATS subject, `@Payload()` extracts data.)
     */
    @EventPattern("app.events")
    handle(@Payload() data: AppEventEnvelope): void {
        this.logger.log(`audit: ${JSON.stringify(data)}`)
        this.appService.processEvent(data)
    }
}
