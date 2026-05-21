/**
 * Service Analytics — cập nhật metrics/thống kê từ event đã nhận.
 * (EN: Analytics Service — updates metrics/statistics from received events.)
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
     * Logic — cập nhật analytics metrics cho event type (mock, chỉ log).
     * Code — nhận payload, trích `type`, log ra console.
     * (EN Logic: Updates analytics metrics for event type (mock, log only).)
     * (EN Code: Receives payload, extracts `type`, logs to console.)
     */
    processEvent(data: AppEventEnvelope): void {
        const t = data.type
        this.logger.log(`Updating metrics for event type: ${String(t)}`)
    }
}
