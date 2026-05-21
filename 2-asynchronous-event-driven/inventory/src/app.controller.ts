/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — nhận event `order-events` từ Kafka, gọi service cập nhật tồn kho.
     * Code — `@EventPattern` lắng nghe topic, `@Payload()` trích payload message.
     * (EN Logic: Receives `order-events` from Kafka, calls service to update stock.)
     * (EN Code: `@EventPattern` listens on topic, `@Payload()` extracts message payload.)
     */
    @EventPattern("order-events")
    handleOrderCreated(@Payload() data) {
        this.logger.log(`Received ORDER_CREATED event: ${JSON.stringify(data)}`)
        this.appService.updateStock(data)
    }
