/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SagaEventsController } from "../saga";
import { FulfillmentEntity } from "../entities";
import { KafkaProducerService } from "./kafka-producer.service";
import { ProductEntity } from "../entities";
import { SeedService } from "./seed.service";
import { StockController } from "./stock.controller";
import { StockService } from "./stock.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, FulfillmentEntity]),
    ClientsModule.register([
      {
        name: "SAGA_EVENTS",
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "inventory-service-producer",
            brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [StockController, SagaEventsController],
  providers: [StockService, KafkaProducerService, SeedService],
})
/**
 * Class `StockModule` — thành phần lab (controller/service/module).
 * (EN: Class `StockModule` — lesson lab component.)
 */
export class StockModule {}
