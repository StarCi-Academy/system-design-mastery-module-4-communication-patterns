/**
 * RabbitMQ consumer controller — Query side projection. Consumes the
 * `customer.profile.updated` event emitted by write-service and projects it
 * into the Elasticsearch read model.
 * (VI: Controller consumer RabbitMQ — nhận event `customer.profile.updated`
 * từ write-service rồi chiếu vào read model Elasticsearch.)
 */
import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ElasticsearchService } from './elasticsearch.service';
import { CUSTOMER_PROFILE_EVENT } from './rmq.constants';

@Controller()
/**
 * Class `CustomerProfileRmqController` — thành phần lab (controller/service/module).
 * (EN: Class `CustomerProfileRmqController` — lesson lab component.)
 */
export class CustomerProfileRmqController {
    private readonly logger = new Logger(CustomerProfileRmqController.name);

    constructor(private readonly es: ElasticsearchService) {}

    /**
     * Consume profile-updated event and project it into Elasticsearch read model (VI: nhận event cập nhật hồ sơ và đồng bộ vào read model Elasticsearch).
     *
     * @param payload - Event payload from broker (VI: dữ liệu event lấy từ broker).
     * @returns Promise<void> - Completes when read model is upserted (VI: hoàn tất khi read model được upsert).
     */
    @EventPattern(CUSTOMER_PROFILE_EVENT)
    async handleProfileUpdated(
        @Payload() payload: { id: string; name: string; email: string },
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const originalMsg = context.getMessage()
        try {
            // Log receive moment for consumer-side observability (VI: ghi log thời điểm nhận để quan sát phía consumer).
            this.logger.log(
                `Received "${CUSTOMER_PROFILE_EVENT}" for customer "${payload.id}"`,
            )
            // Persist projection so query-side data stays eventually consistent (VI: ghi projection để giữ nhất quán cuối cùng cho query side).
            await this.es.upsertCustomer(payload)
            // Log processed moment to measure consume-to-project latency (VI: ghi log xử lý xong để đo độ trễ từ consume đến projection).
            this.logger.log(
                `Processed "${CUSTOMER_PROFILE_EVENT}" for customer "${payload.id}"`,
            )
            // Ack only after the projection succeeds so unprocessed events stay in the queue (VI: chỉ ack sau khi project thành công để event chưa xử lý vẫn nằm trong queue).
            channel.ack(originalMsg)
        } catch (e) {
            this.logger.error(e)
            // Nack with requeue so a transient failure is retried, not lost (VI: nack + requeue để lỗi tạm thời được giao lại, không mất event).
            channel.nack(originalMsg, false, true)
        }
    }
}
