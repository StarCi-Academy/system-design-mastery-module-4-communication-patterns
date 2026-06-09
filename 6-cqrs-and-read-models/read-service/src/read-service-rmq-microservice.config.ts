/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    Transport 
} from "@nestjs/microservices"
import {
    CUSTOMER_PROFILE_QUEUE 
} from "./customer"

/**
 * NestJS microservices consumer (Transport.RMQ) — syncs Elasticsearch from RabbitMQ.
 * Wired in main.ts via app.connectMicroservice(...).
 */
export function buildReadServiceRmqMicroserviceOptions() {
    return {
        transport: Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL ?? "amqp://localhost:5672"],
            queue: process.env.RABBITMQ_QUEUE ?? CUSTOMER_PROFILE_QUEUE,
            queueOptions: {
                durable: true 
            },
            noAck: false,
            prefetchCount: 1,
            socketOptions: {
                heartbeatIntervalInSeconds: 60,
                reconnectTimeInSeconds: 5,
            },
        },
    }
}
