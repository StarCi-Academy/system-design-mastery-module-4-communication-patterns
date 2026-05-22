/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — nhận POST /publish, gọi service emit event NATS trên topic `app.events`.
     * Code — `@Post("publish")` map endpoint, uỷ thác cho `AppService.publish`.
     * (EN Logic: Receives POST /publish, calls service to emit NATS event on `app.events` topic.)
     * (EN Code: `@Post("publish")` maps endpoint, delegates to `AppService.publish`.)
     */
    @Post("publish")
    publish(@Body() body: PublishRequestBody): Promise<PublishResponse> {
        this.logger.log("Received publish request")
        return this.appService.publish(body)
    }
