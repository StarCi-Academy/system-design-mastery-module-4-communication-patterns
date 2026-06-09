/**
 * HTTP controller — route demo, delegate sang service.
 * (EN: HTTP controller — demo routes delegating to service.)
 */
import { Body, Controller, Post } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller()
/**
 * Class `OrdersController` — thành phần lab (controller/service/module).
 * (EN: Class `OrdersController` — lesson lab component.)
 */
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post("order")
  async create(@Body() body: { productId: number; quantity: number }) {
    const order = await this.orders.create(body.productId, body.quantity);
    return { ...order, status: order.status };
  }
}
