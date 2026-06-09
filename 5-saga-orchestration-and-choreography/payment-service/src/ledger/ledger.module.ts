/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SagaEventsController } from "../saga";
import { KafkaProducerService } from "./kafka-producer.service";
import { PaymentEntity } from "../entities";
import { PaymentService } from "./payment.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity]),
    ClientsModule.register([
      {
        name: "SAGA_EVENTS",
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "payment-service-producer",
            brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [SagaEventsController],
  providers: [PaymentService, KafkaProducerService],
})
/**
 * Class `LedgerModule` — thành phần lab (controller/service/module).
 * (EN: Class `LedgerModule` — lesson lab component.)
 */
export class LedgerModule {}
