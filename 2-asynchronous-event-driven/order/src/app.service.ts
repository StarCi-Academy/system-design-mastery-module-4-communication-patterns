/**
 * Service Order — tạo đơn hàng và emit event Kafka `order-events`.
 * (EN: Order Service — creates order and emits Kafka event `order-events`.)
 */
import {
    Inject,
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    ClientKafka,
} from "@nestjs/microservices"

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)
    // In-memory order store for the demo (replace with a real DB in production)
    private readonly orders: Array<Record<string, unknown>> = []

    constructor(
        @Inject("KAFKA_SERVICE") private readonly kafkaClient: ClientKafka,
    ) {}

    /**
     * Logic — tạo order ID ngẫu nhiên, lưu vào in-memory store, emit event Kafka.
     * Code — `kafkaClient.emit('order-events', event)` phát fire-and-forget tới topic.
     * (EN Logic: Generates random order ID, saves to in-memory store, emits Kafka event.)
     * (EN Code: `kafkaClient.emit('order-events', event)` fires event to topic.)
     */
    createOrder(input: { productName: string; quantity: number }): {
        id: number; productName: string; quantity: number; status: string
    } {
        const id = Math.floor(Math.random() * 100000)
        const order = { id, productName: input.productName, quantity: input.quantity, status: "PENDING" }
        // Persist to in-memory list so GET /orders can return it
        this.orders.push(order)

        // Fire-and-forget publish to topic `order-events`; we do NOT await any consumer
        this.kafkaClient.emit("order-events", {
            eventType: "ORDER_CREATED",
            orderId: id,
            productName: input.productName,
            quantity: input.quantity,
            timestamp: new Date().toISOString(),
        })
        this.logger.log(`Order ${id} created and ORDER_CREATED event emitted`)

        return order
    }

    /**
     * Logic — trả về danh sách đơn đã tạo trong phiên.
     * Code — trả mảng in-memory `this.orders`.
     * (EN Logic: Returns list of orders created this session.)
     * (EN Code: Returns in-memory `this.orders` array.)
     */
    getOrders(): Array<Record<string, unknown>> {
        return this.orders
    }
}
