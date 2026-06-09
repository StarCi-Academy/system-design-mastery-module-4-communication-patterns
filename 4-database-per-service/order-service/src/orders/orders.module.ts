/**
 * Feature module quản lý đơn hàng — TypeORM repository + Kafka emit.
 * (EN: Orders feature module — TypeORM repository + Kafka emit.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    Order,
} from "../entities"
import {
    OrdersService,
} from "./orders.service"
import {
    OrdersController,
} from "./orders.controller"

import {
    ClientsModule,
    Transport,
} from "@nestjs/microservices"

@Module({
    imports: [
        TypeOrmModule.forFeature([Order]),
        ClientsModule.register([
            {
                name: "KAFKA_CLIENT",
                transport: Transport.KAFKA,
                options: {
                    client: {
                        clientId: "database-per-service-order",
                        brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
                    },
                    consumer: {
                        groupId: "database-per-service-order-producer",
                    },
                    producerOnlyMode: true,
                },
            },
        ]),
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
})
/**
 * Class `OrdersModule` — thành phần lab (controller/service/module).
 * (EN: Class `OrdersModule` — lesson lab component.)
 */
export class OrdersModule {}
