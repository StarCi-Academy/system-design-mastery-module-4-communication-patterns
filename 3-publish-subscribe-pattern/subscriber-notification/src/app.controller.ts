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
 * Class `AppController` — NATS event listener for notification subscriber.
 * (EN: Class `AppController` — NATS event listener for notification subscriber.)
 */
@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    /**
     * Logic — nhận event `app.events`, gọi service gửi email/push notification.
     * Code — `@EventPattern` lắng nghe NATS subject, `@Payload()` trích data.
     * (EN Logic: Receives `app.events`, calls service to send email/push notification.)
     * (EN Code: `@EventPattern` listens on NATS subject, `@Payload()` extracts data.)
     */
    @EventPattern("app.events")
    handle(@Payload() data: AppEventEnvelope): void {
        this.logger.log(`notification: ${JSON.stringify(data)}`)
        this.appService.processEvent(data)
    }
}
