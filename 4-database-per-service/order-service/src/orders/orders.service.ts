/**
 * Logic — tạo đơn hàng trong PostgreSQL, sau đó emit event `order-events` lên Kafka.
 * Code — `TypeORM repo.create() + repo.save()`, rồi `kafka.emit("order-events", payload)`.
 * (EN Logic: Creates an order in PostgreSQL, then emits `order-events` to Kafka.)
 * (EN Code: `TypeORM repo.create() + repo.save()`, then `kafka.emit("order-events", payload)`.)
 */
import {
    Inject,
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    ClientKafka,
} from "@nestjs/microservices"
import { lastValueFrom } from "rxjs"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    Order,
} from "../entities"

@Injectable()
/**
 * Class `OrdersService` — thành phần lab (controller/service/module).
 * (EN: Class `OrdersService` — lesson lab component.)
 */
export class OrdersService implements OnModuleInit {
    constructor(
        @InjectRepository(Order)
        private readonly repo: Repository<Order>,
        @Inject("KAFKA_CLIENT") private readonly kafka: ClientKafka,
    ) {}

    /**
     * Logic — kết nối Kafka producer khi module khởi tạo.
     * Code — `OnModuleInit` hook: `await this.kafka.connect()`.
     * (EN Logic: Connect Kafka producer on module init.)
     * (EN Code: `OnModuleInit` hook: `await this.kafka.connect()`.)
     */
    async onModuleInit() {
        await this.kafka.connect()
    }

    /**
     * Logic — lưu order vào PostgreSQL, emit event cho Inventory consumer.
     * Code — `repo.create() + repo.save()` → `kafka.emit("order-events", { orderId, ... })`.
     * (EN Logic: Persist order to PostgreSQL, emit event for Inventory consumer.)
     * (EN Code: `repo.create() + repo.save()` → `kafka.emit("order-events", { orderId, ... })`.)
     */
    async create(
        customerId: string,
        totalAmount: number,
        productName?: string,
        quantity?: number,
    ) {
        const row = this.repo.create({
            customerId,
            totalAmount: totalAmount.toFixed(2),
        })
        const saved = await this.repo.save(row)
        await lastValueFrom(
            this.kafka.emit("order-events", {
                orderId: saved.id,
                customerId: saved.customerId,
                totalAmount: saved.totalAmount,
                productName: productName ?? null,
                quantity: quantity ?? null,
            })
        )
        return saved
    }
}
