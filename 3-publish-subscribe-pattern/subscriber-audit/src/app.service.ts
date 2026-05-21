/**
 * Service Audit — ghi event vào audit log database (mock).
 * (EN: Audit Service — writes event to audit log database (mock).)
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
     * Logic — ghi event vào audit log (mock, chỉ log).
     * Code — nhận payload, trích `type`, log ra console.
     * (EN Logic: Writes event to audit log (mock, log only).)
     * (EN Code: Receives payload, extracts `type`, logs to console.)
     */
    processEvent(data: AppEventEnvelope): void {
        const t = data.type
        this.logger.log(`Saving event to audit log database: ${String(t)}`)
    }
}
