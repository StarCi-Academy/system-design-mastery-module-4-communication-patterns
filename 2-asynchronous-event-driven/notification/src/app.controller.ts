/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — nhận event `order-events` từ Kafka, gọi service gửi thông báo.
     * Code — `@EventPattern` lắng nghe topic, `@Payload()` trích payload message.
     * (EN Logic: Receives `order-events` from Kafka, calls service to send notification.)
     * (EN Code: `@EventPattern` listens on topic, `@Payload()` extracts message payload.)
     */
    @EventPattern("order-events")
    handleOrderCreated(@Payload() data) {
        this.logger.log(`Received ORDER_CREATED event: ${JSON.stringify(data)}`)
        this.appService.sendNotification(data)
    }
