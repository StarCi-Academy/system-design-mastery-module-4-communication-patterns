/**
 * Service Publisher — emit event qua NATS tới topic `app.events`.
 * (EN: Publisher Service — emits event via NATS to `app.events` topic.)
 */
import {
    Inject,
    Injectable,
    Logger,
    OnModuleInit,
} from "@nestjs/common"
import {
    ClientProxy,
} from "@nestjs/microservices"
import {
    firstValueFrom,
} from "rxjs"
import type {
    AppEventEnvelope,
    PublishRequestBody,
    PublishResponse,
} from "./types"

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService implements OnModuleInit {
    private readonly logger = new Logger(AppService.name)

    constructor(
        @Inject("NATS_SERVICE") private readonly nats: ClientProxy,
    ) {}

    /**
     * Logic — kết nối NATS client khi module khởi tạo.
     * Code — `this.nats.connect()` mở connection tới NATS server.
     * (EN Logic: Connects NATS client when module initializes.)
     * (EN Code: `this.nats.connect()` opens connection to NATS server.)
     */
    async onModuleInit() {
        await this.nats.connect()
    }

    /**
     * Logic — tách `type` + `payload` từ body, gắn timestamp, emit fire-and-forget.
     * Code — `this.nats.emit("app.events", envelope)` phát event tới tất cả subscriber.
     * (EN Logic: Extracts `type` + `payload` from body, attaches timestamp, emits fire-and-forget.)
     * (EN Code: `this.nats.emit("app.events", envelope)` broadcasts event to all subscribers.)
     */
    async publish(body: PublishRequestBody): Promise<PublishResponse> {
        const type = typeof body.type === "string" ? body.type : "unknown"
        const payload = body.payload
        this.logger.log(`Publishing event ${type} to NATS`)

        const envelope: AppEventEnvelope = {
            type,
            payload,
            timestamp: new Date().toISOString(),
        }
        await firstValueFrom(
            this.nats.emit("app.events", envelope),
        )

        return {
            message: "Event Published",
            type,
        }
    }
}
