/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — nhận POST /orders từ client, gọi service tạo đơn + emit event.
     * Code — `@Post()` map REST endpoint, uỷ thác logic cho `AppService.createOrder`.
     * (EN Logic: Receives POST /orders from client, calls service to create order + emit event.)
     * (EN Code: `@Post()` maps REST endpoint, delegates to `AppService.createOrder`.)
     */
    @Post()
    async createOrder(@Body() orderData) {
        this.logger.log("Received request to create order")
        return this.appService.createOrder(orderData)
    }
