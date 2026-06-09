/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    ClientsModule,
    Transport,
} from "@nestjs/microservices"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    Customer,
} from "../entities"
import {
    CustomerController,
} from "./customer.controller"
import {
    PublishCustomerProfileUpdatedHandler,
    UpsertCustomerHandler,
} from "./handlers"
import {
    CUSTOMER_PROFILE_QUEUE,
} from "./rmq.constants"
import {
    RmqEventPublisher,
} from "./rmq-event.publisher"

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([Customer]),
        ClientsModule.register([
            {
                name: "CUSTOMER_EVENTS",
                transport: Transport.RMQ,
                options: {
                    urls: [process.env.RABBITMQ_URL ?? "amqp://localhost:5672"],
                    queue: process.env.RABBITMQ_QUEUE ?? CUSTOMER_PROFILE_QUEUE,
                    queueOptions: { durable: true },
                    persistent: true,
                    socketOptions: {
                        heartbeatIntervalInSeconds: 60,
                        reconnectTimeInSeconds: 5,
                    },
                },
            },
        ]),
    ],
    controllers: [CustomerController],
    providers: [
        UpsertCustomerHandler,
        PublishCustomerProfileUpdatedHandler,
        RmqEventPublisher,
    ],
})
/**
 * Class `CustomerModule` — thành phần lab (controller/service/module).
 * (EN: Class `CustomerModule` — lesson lab component.)
 */
export class CustomerModule {}
