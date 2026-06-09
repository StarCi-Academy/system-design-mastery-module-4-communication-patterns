/**
 * Order controller — exposes POST /orders and GET /orders.
 * The service does not know it sits behind Kong; it handles plain HTTP.
 * (EN: Controller that demonstrates service-level ignorance of the gateway.)
 */
import {
    Body,
    Controller,
    Get,
    Post,
} from "@nestjs/common"
import {
    AppService,
    CreateOrderInput,
    Order,
} from "./app.service"

@Controller("orders")
/**
 * Class `AppController` — REST controller for order resource.
 * Handles POST (create) and GET (list) delegating to `AppService`.
 */
export class AppController {
    constructor(private readonly appService: AppService) {}

    /**
     * Create a new order in PENDING state and return it with HTTP 201.
     * Nest returns 201 by default for @Post handlers.
     * @param body - ProductId and quantity from the request body.
     * @returns The newly created order with status PENDING.
     */
    @Post()
    create(@Body() body: CreateOrderInput): Order {
        // POST /orders → Nest returns HTTP 201 by default; gateway relays it verbatim.
        return this.appService.create(body)
    }

    /**
     * Return the list of all orders.
     * @returns Array of all orders created so far (HTTP 200).
     */
    @Get()
    list(): Order[] {
        return this.appService.list()
    }
}
