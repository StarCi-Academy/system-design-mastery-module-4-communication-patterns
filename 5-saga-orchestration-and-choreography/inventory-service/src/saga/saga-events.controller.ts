/**
 * Kafka controller — consume saga.demo.events, route to inventory handler.
 * (EN: Kafka controller — consumes saga.demo.events, routes to inventory handler.)
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
    StockService,
} from "../stock/stock.service"
import type {
    SagaEvent,
} from "./saga.events"
import {
    TOPIC,
} from "./saga.constants"

@Controller()
export class SagaEventsController {
    private readonly log = new Logger(SagaEventsController.name)

    constructor(private readonly stock: StockService) {}

    /**
     * Logic — consumer group route event → StockService.handleSagaEvent.
     * Code — @EventPattern(TOPIC) + @Payload → handleSagaEvent.
     * (EN Logic: Route consumed saga events to inventory handler.)
     * (EN Code: EventPattern → handleSagaEvent.)
     */
    @EventPattern(TOPIC)
    async handle(@Payload() event: SagaEvent): Promise<void> {
        if (!event?.event) {
            return
        }
        this.log.log(`Consumed event "${event.event}" for order "${event.orderId}"`)
        await this.stock.handleSagaEvent(event)
    }
}
