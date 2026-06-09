import {
    EventsHandler, IEventHandler 
} from "@nestjs/cqrs"
import {
    CustomerProfileUpdatedEvent,
} from "../events"
import {
    RmqEventPublisher,
} from "../rmq-event.publisher"

@EventsHandler(CustomerProfileUpdatedEvent)
export class PublishCustomerProfileUpdatedHandler
implements IEventHandler<CustomerProfileUpdatedEvent>
{
    constructor(private readonly rmq: RmqEventPublisher) {}

    async handle(event: CustomerProfileUpdatedEvent) {
        await this.rmq.publishProfile({
            id: event.id,
            name: event.name,
            email: event.email,
        })
    }
}
