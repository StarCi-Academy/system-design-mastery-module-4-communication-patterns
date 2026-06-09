/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KafkaProducerService } from "../saga";
import { TOPIC } from "../saga";
import { SagaEventsController } from "../saga";
import { OrderEntity } from "../entities";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    ClientsModule.register([
      {
        name: "SAGA_EVENTS",
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "order-service-producer",
            brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [OrdersController, SagaEventsController],
  providers: [OrdersService, KafkaProducerService],
})
/**
 * Class `OrdersModule` — thành phần lab (controller/service/module).
 * (EN: Class `OrdersModule` — lesson lab component.)
 */
export class OrdersModule {}
