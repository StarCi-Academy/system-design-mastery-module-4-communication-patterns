/**
 * Service lesson — inventory saga step (reserve stock / out-of-stock compensation).
 * (EN: Lesson service — inventory saga step (reserve stock / out-of-stock compensation).)
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
    ProductEntity,
    FulfillmentEntity,
} from "../entities"
import {
    KafkaProducerService,
} from "./kafka-producer.service"
import type {
    SagaEvent,
} from "../saga/saga.events"
import type {
    InventoryCheckResult,
} from "../types"
import {
    firstValueFrom,
} from "rxjs"

@Injectable()
export class StockService {
    private readonly log = new Logger(StockService.name)

    constructor(
        @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
        @InjectRepository(FulfillmentEntity) private readonly fulfillments: Repository<FulfillmentEntity>,
        private readonly producer: KafkaProducerService,
    ) {}

    /**
     * Logic — Xử lý nghiệp vụ `tryFulfill` cho lab.
     * Code — `async tryFulfill()` — gọi dependency inject / client.
     * (EN Logic: Business handler `tryFulfill` for the lab.)
     * (EN Code: `async tryFulfill()` — uses injected deps / clients.)
     */
    async tryFulfill(orderId: number, productId: number, quantity: number): Promise<InventoryCheckResult> {
        // Idempotency check: if already fulfilled, skip duplicate processing (VI: chống xử lý trùng khi event bị consume lại).
        const done = await this.fulfillments.findOne({
            where: {
                orderId,
            },
        })
        if (done) {
            return {
                ok: true,
                orderId,
                productId,
                quantity,
                status: "ALREADY_FULFILLED",
                message: "Order has already been fulfilled",
            }
        }

        // Validate stock before mutating inventory state (VI: kiểm tra tồn kho trước khi thay đổi dữ liệu).
        const product = await this.products.findOne({
            where: {
                id: productId,
            },
        })
        if (!product || product.stock < quantity) {
            // Publish compensation trigger so upstream services can rollback/cancel (VI: phát event bù trừ để upstream rollback/hủy đơn).
            await firstValueFrom(
                this.producer.emit({
                    event: "INVENTORY_OUT_OF_STOCK",
                    orderId,
                    productId,
                }),
            )
            this.log.log(`Out of stock for order "${orderId}"`)
            return {
                ok: false,
                orderId,
                productId,
                quantity,
                status: "OUT_OF_STOCK",
                message: "Product is out of stock for requested quantity",
                remainingStock: product?.stock ?? 0,
            }
        }

        // Commit stock decrement and fulfillment marker atomically in saga step order (VI: trừ kho và ghi fulfillment theo đúng thứ tự bước saga).
        product.stock -= quantity
        await this.products.save(product)
        await this.fulfillments.save(this.fulfillments.create({
            orderId, status: "DONE",
        }))
        // Publish success so order service can mark order completed (VI: phát event thành công để order service hoàn tất đơn).
        await firstValueFrom(
            this.producer.emit({
                event: "INVENTORY_OK",
                orderId,
                productId,
                quantity,
            }),
        )
        this.log.log(`Fulfilled order "${orderId}"`)
        return {
            ok: true,
            orderId,
            productId,
            quantity,
            status: "FULFILLED",
            message: "Inventory reserved successfully",
            remainingStock: product.stock,
        }
    }

    /**
     * Logic — Xử lý message/job trong `handleSagaEvent`.
     * Code — Parse payload → side effects (DB/Kafka) → ack/return.
     * (EN Logic: Process message/job in `handleSagaEvent`.)
     * (EN Code: Parse payload → side effects → ack/return.)
     */
    async handleSagaEvent(event: SagaEvent) {
        if (event.event === "PAYMENT_CAPTURED") {
            // Payment success is the trigger to reserve stock in choreography flow (VI: thanh toán thành công là điều kiện để bắt đầu bước trừ kho).
            await this.tryFulfill(event.orderId,
                event.productId,
                event.quantity)
        }
    }
}
