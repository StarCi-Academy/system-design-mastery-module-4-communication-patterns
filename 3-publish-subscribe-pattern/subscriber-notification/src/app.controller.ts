/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — nhận event `app.events`, gọi service gửi email/push notification.
     * Code — `@EventPattern` lắng nghe NATS subject, `@Payload()` trích data.
     * (EN Logic: Receives `app.events`, calls service to send email/push notification.)
     * (EN Code: `@EventPattern` listens on NATS subject, `@Payload()` extracts data.)
     */
    @EventPattern("app.events")
    handle(@Payload() data: AppEventEnvelope): void {
        this.logger.log(`notification: ${JSON.stringify(data)}`)
        this.appService.processEvent(data)
    }
