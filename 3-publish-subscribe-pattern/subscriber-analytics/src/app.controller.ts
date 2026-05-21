/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — nhận event `app.events`, gọi service xử lý analytics.
     * Code — `@EventPattern` lắng nghe NATS subject, `@Payload()` trích data.
     * (EN Logic: Receives `app.events`, calls service to process analytics.)
     * (EN Code: `@EventPattern` listens on NATS subject, `@Payload()` extracts data.)
     */
    @EventPattern("app.events")
    handle(@Payload() data: AppEventEnvelope): void {
        this.logger.log(`analytics: ${JSON.stringify(data)}`)
        this.appService.processEvent(data)
    }
