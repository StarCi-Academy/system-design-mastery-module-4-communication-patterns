/**
 * Product Service — manages products in memory (no DB required for gateway demo).
 * (EN: Product Service — in-memory data store to demonstrate Kong Gateway routing.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

/** Shape of a product resource. */
export interface Product {
    /** Auto-increment integer id assigned by the service. */
    id: number
    /** Product display name. */
    name: string
    /** Unit price in whole currency units. */
    price: number
    /** Number of units in stock. */
    stock: number
}

/** Input body for creating a new product. */
export interface CreateProductInput {
    /** Product display name submitted by the client. */
    name: string
    /** Unit price submitted by the client. */
    price: number
    /** Stock count submitted by the client. */
    stock: number
}

@Injectable()
/**
 * Class `AppService` — holds product state and exposes create / list operations.
 * (EN: In-memory data source; business logic (price, stock) lives here, not in the gateway.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /** In-memory product list. Grows with each POST /products call. */
    private readonly products: Product[] = []

    /** Auto-increment counter — incremented before each insert so ids start at 1. */
    private counter = 0

    /**
     * Create a new product and append it to the in-memory list.
     * @param input - Name, price, and stock from the request body.
     * @returns The newly created product with its assigned id.
     */
    create(input: CreateProductInput): Product {
        // Increment counter first so the first id is 1, not 0.
        const created: Product = {
            id: ++this.counter,
            name: input.name,
            price: input.price,
            stock: input.stock,
        }
        // Persist in memory; visible to subsequent GET /products calls.
        this.products.push(created)
        this.logger.log(`Created product id=${created.id}`)
        return created
    }

    /**
     * Return the full list of products created so far.
     * @returns Snapshot array of all in-memory products.
     */
    list(): Product[] {
        this.logger.log("Listing products")
        // Return a shallow copy so callers cannot mutate the internal array.
        return [...this.products]
    }
}
