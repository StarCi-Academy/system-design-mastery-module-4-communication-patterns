/**
 * Product controller — exposes POST /products and GET /products.
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
    CreateProductInput,
    Product,
} from "./app.service"

@Controller("products")
/**
 * Class `AppController` — REST controller for product resource.
 * Handles POST (create) and GET (list) delegating to `AppService`.
 */
export class AppController {
    constructor(private readonly appService: AppService) {}

    /**
     * Create a new product and return it with HTTP 201.
     * Nest returns 201 by default for @Post handlers.
     * @param body - Name, price, and stock from the request body.
     * @returns The newly created product.
     */
    @Post()
    create(@Body() body: CreateProductInput): Product {
        // POST /products → Nest returns HTTP 201 by default; gateway relays it verbatim.
        return this.appService.create(body)
    }

    /**
     * Return the list of all products.
     * @returns Array of all products created so far (HTTP 200).
     */
    @Get()
    list(): Product[] {
        return this.appService.list()
    }
}
