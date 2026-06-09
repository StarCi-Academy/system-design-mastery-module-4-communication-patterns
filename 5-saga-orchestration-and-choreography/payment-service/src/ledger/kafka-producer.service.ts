/**
 * Service lesson — Kafka producer OnModuleInit cho saga topic.
 * (EN: Lesson service — Kafka producer OnModuleInit for saga topic.)
 */
import {
    Inject,
    Injectable,
    Logger,
    OnModuleInit,
} from "@nestjs/common"
import {
    ClientKafka,
} from "@nestjs/microservices"
import {
    TOPIC,
} from "../saga/saga.constants"
import type {
    SagaEvent,
} from "../saga/saga.events"

@Injectable()
export class KafkaProducerService implements OnModuleInit {
    private readonly logger = new Logger(KafkaProducerService.name)

    constructor(@Inject("SAGA_EVENTS") private readonly client: ClientKafka) {}

    /**
     * Logic — kết nối Kafka producer khi module sẵn sàng.
     * Code — OnModuleInit → client.connect().
     * (EN Logic: Connect Kafka producer on module init.)
     * (EN Code: OnModuleInit → connect().)
     */
    async onModuleInit(): Promise<void> {
        await this.client.connect()
    }

    /**
     * Logic — publish saga event lên topic choreography.
     * Code — client.emit(TOPIC, event).
     * (EN Logic: Publish saga event to choreography topic.)
     * (EN Code: emit to TOPIC.)
     */
    emit(event: SagaEvent) {
        this.logger.log(`Publishing event "${event.event}" for order "${event.orderId}"`)
        return this.client.emit(TOPIC, event)
    }
}
