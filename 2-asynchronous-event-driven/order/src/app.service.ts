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

    constructor(
        @Inject("KAFKA_SERVICE") private readonly kafkaClient: ClientKafka,
    ) {}

    /**
     * Logic — tạo order ID ngẫu nhiên, gắn timestamp, emit event Kafka.
     * Code — `kafkaClient.emit('order-events', event)` phát fire-and-forget tới topic.
     * (EN Logic: Generates random order ID, attaches timestamp, emits Kafka event.)
     * (EN Code: `kafkaClient.emit('order-events', event)` fires event to topic.)
     */
    async createOrder(orderData) {
        const orderId = Math.floor(Math.random() * 100000)
        const event = {
            orderId,
            ...orderData,
            timestamp: new Date().toISOString(),
        }

        this.logger.log(`Creating order ${orderId} and emitting ORDER_CREATED event`)

        // Emit event fire-and-forget tới Kafka topic `order-events`.
        // (EN: Fire-and-forget emit to Kafka topic `order-events`.)
        this.kafkaClient.emit("order-events", event)

        return {
            message: "Order Created",
            orderId,
            status: "Pending",
        }
    }
}
