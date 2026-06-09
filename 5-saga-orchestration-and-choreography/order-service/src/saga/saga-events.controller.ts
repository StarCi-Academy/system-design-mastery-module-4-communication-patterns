/**
 * Kafka controller — consume saga.demo.events.
 * (EN: Kafka controller — consumes saga.demo.events.)
 */
import {
    Controller,
    Logger,
} from "@nestjs/common"
import {
    EventPattern,
    Payload,
} from "@nestjs/microservices"
import {
    OrdersService,
} from "../orders/orders.service"
import type {
    SagaEvent,
} from "./saga.events"
import {
    TOPIC,
} from "./saga.constants"

@Controller()
export class SagaEventsController {
    private readonly logger = new Logger(SagaEventsController.name)

    constructor(private readonly orders: OrdersService) {}

    /**
     * Logic — consumer group route event → OrdersService.handleSagaEvent.
     * Code — @EventPattern(TOPIC) + @Payload → handleSagaEvent.
     * (EN Logic: Route consumed saga events to order handler.)
     * (EN Code: EventPattern → handleSagaEvent.)
     */
    @EventPattern(TOPIC)
    async handle(@Payload() event: SagaEvent): Promise<void> {
        if (!event?.event) return
        this.logger.log(`Consumed event "${event.event}" for order "${event.orderId}"`)
        await this.orders.handleSagaEvent(event)
    }
}
