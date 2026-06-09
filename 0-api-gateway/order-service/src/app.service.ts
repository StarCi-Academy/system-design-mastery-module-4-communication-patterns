/**
 * Order Service — manages orders in memory (no DB required for gateway demo).
 * Business rule: every order is initialized in PENDING state by the service, not the gateway.
 * (EN: Demonstrates that domain rules (PENDING) belong here, not at the gateway layer.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

/** Shape of an order resource. */
export interface Order {
    /** Auto-increment integer id assigned by the service. */
    id: number
    /** Id of the product being ordered. */
    productId: number
    /** Number of units ordered. */
    quantity: number
    /**
     * Order lifecycle status.
     * Always "PENDING" at creation — only the service can change it later.
     */
    status: "PENDING"
}

/** Input body for creating a new order. */
export interface CreateOrderInput {
    /** Id of the product to order. */
    productId: number
    /** Number of units requested by the client. */
    quantity: number
}

@Injectable()
/**
 * Class `AppService` — holds order state and enforces the PENDING-on-create rule.
 * (EN: Business rule that orders start PENDING lives here, not in Kong or the compose file.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /** In-memory order list. Grows with each POST /orders call. */
    private readonly orders: Order[] = []

    /** Auto-increment counter — incremented before each insert so ids start at 1. */
    private counter = 0

    /**
     * Create a new order in PENDING state.
     * The PENDING rule is a service invariant: the gateway only transports the request.
     * @param input - ProductId and quantity from the request body.
     * @returns The newly created order with status PENDING.
     */
    create(input: CreateOrderInput): Order {
        // order-service: the PENDING rule lives in the service, not the gateway.
        const created: Order = {
            id: ++this.counter,
            productId: input.productId,
            quantity: input.quantity,
            // Business invariant: all new orders start in PENDING state.
            status: "PENDING",
        }
        // Persist in memory; visible to subsequent GET /orders calls.
        this.orders.push(created)
        this.logger.log(`Created order id=${created.id} status=PENDING`)
        return created
    }

    /**
     * Return the full list of orders created so far.
     * @returns Snapshot array of all in-memory orders.
     */
    list(): Order[] {
        this.logger.log("Listing orders")
        // Return a shallow copy so callers cannot mutate the internal array.
        return [...this.orders]
    }
}
