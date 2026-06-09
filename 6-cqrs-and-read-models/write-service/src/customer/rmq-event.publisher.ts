import {
    Inject, Injectable, Logger
} from "@nestjs/common"
import {
    ClientProxy
} from "@nestjs/microservices"
import {
    firstValueFrom
} from "rxjs"
import {
    CUSTOMER_PROFILE_EVENT
} from "./rmq.constants"

@Injectable()
export class RmqEventPublisher {
    private readonly logger = new Logger(RmqEventPublisher.name)

    constructor(
        @Inject("CUSTOMER_EVENTS") private readonly client: ClientProxy,
    ) {}

    /**
     * Publish customer profile update event to message broker (VI: phát event cập nhật hồ sơ khách hàng lên broker).
     *
     * @param payload - Customer profile snapshot (VI: dữ liệu hồ sơ khách hàng để đồng bộ read model).
     * @returns Promise<void> - Completes when broker accepts the emit call (VI: hoàn tất khi broker nhận emit).
     */
    async publishProfile(payload: { id: string; name: string; email: string }) {
        // Log before emitting so we can trace producer side in distributed flow (VI: ghi log phía producer trước khi phát event).
        this.logger.log(
            `Broadcasting "${CUSTOMER_PROFILE_EVENT}" for customer "${payload.id}"`,
        )
        // Wait for emit observable completion to make delivery intent explicit (VI: chờ observable hoàn tất để bảo đảm intent phát event rõ ràng).
        await firstValueFrom(
            this.client.emit(
                CUSTOMER_PROFILE_EVENT,
                payload,
            ),
        )
        // Log completion to pair with consumer logs during incident analysis (VI: log hoàn tất để đối chiếu với log bên consumer khi debug).
        this.logger.log(
            `Broadcast completed for "${CUSTOMER_PROFILE_EVENT}" and customer "${payload.id}"`,
        )
    }
}
