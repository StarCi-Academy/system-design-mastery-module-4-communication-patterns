/**
 * Service Notification — gửi email/push notification cho event (mock).
 * (EN: Notification Service — sends email/push notification for event (mock).)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import type {
    AppEventEnvelope,
} from "./types"

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /**
     * Logic — gửi email/push cho event type (mock, chỉ log).
     * Code — nhận payload, trích `type`, log ra console.
     * (EN Logic: Sends email/push for event type (mock, log only).)
     * (EN Code: Receives payload, extracts `type`, logs to console.)
     */
    processEvent(data: AppEventEnvelope): void {
        const t = data.type
        this.logger.log(`Sending email/push notification for event: ${String(t)}`)
    }
}
