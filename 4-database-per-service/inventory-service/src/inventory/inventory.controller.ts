/**
 * HTTP controller — tạo sản phẩm trong kho MongoDB.
 * (EN: HTTP controller — create products in MongoDB inventory.)
 */
import {
    Body,
    Controller,
    Post,
} from "@nestjs/common"
import {
    InventoryService,
} from "./inventory.service"

@Controller("inventory")
/**
 * Class `InventoryController` — thành phần lab (controller/service/module).
 * (EN: Class `InventoryController` — lesson lab component.)
 */
export class InventoryController {
    constructor(private readonly inventory: InventoryService) {}

    /**
     * Logic — tạo sản phẩm mới với số lượng tồn kho ban đầu.
     * Code — `@Post()` → `this.inventory.create(name, stock)`.
     * (EN Logic: Creates a new product with initial stock quantity.)
     * (EN Code: `@Post()` → `this.inventory.create(name, stock)`.)
     */
    @Post()
    async create(
        @Body() body: { name: string; stock: number },
    ): Promise<ReturnType<InventoryService["create"]>> {
        return this.inventory.create(body.name, body.stock)
    }
}
