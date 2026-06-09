/**
 * Service lesson — saga choreography order aggregate.
 * (EN: Lesson service — saga choreography order aggregate.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    firstValueFrom,
} from "rxjs"
import {
    OrderEntity,
} from "../entities"
import {
    KafkaProducerService,
} from "../saga/kafka-producer.service"
import type {
    SagaEvent,
} from "../saga/saga.events"

@Injectable()
export class OrdersService {
    private readonly log = new Logger(OrdersService.name)

    constructor(
        @InjectRepository(OrderEntity) private readonly repo: Repository<OrderEntity>,
        private readonly producer: KafkaProducerService,
    ) {}

    /**
     * Logic — tạo order PENDING rồi emit ORDER_CREATED (choreography saga).
     * Code — repo.create/save → firstValueFrom(producer.emit).
     * (EN Logic: Create PENDING order then emit ORDER_CREATED.)
     * (EN Code: TypeORM save → Kafka emit.)
     */
    async create(productId: number, quantity: number): Promise<OrderEntity> {
        const row = this.repo.create({ productId, quantity, status: "PENDING" })
        await this.repo.save(row)
        await firstValueFrom(
            this.producer.emit({
                event: "ORDER_CREATED",
                orderId: row.id,
                productId,
                quantity,
            }),
        )
        return row
    }

    /**
     * Logic — cập nhật trạng thái order theo event saga (OK / cancel).
     * Code — nhánh INVENTORY_OK → COMPLETED; OUT_OF_STOCK/REFUND → CANCELLED.
     * (EN Logic: Transition order state from saga events.)
     * (EN Code: branch updates on event type.)
     */
    async handleSagaEvent(event: SagaEvent): Promise<void> {
        if (event.event === "INVENTORY_OK") {
            await this.repo.update({ id: event.orderId }, { status: "COMPLETED" })
            this.log.log(`Order "${event.orderId}" completed`)
            return
        }
        if (event.event === "INVENTORY_OUT_OF_STOCK" || event.event === "PAYMENT_REFUNDED") {
            await this.repo.update({ id: event.orderId }, { status: "CANCELLED" })
            this.log.log(`Order "${event.orderId}" cancelled`)
        }
    }
}
