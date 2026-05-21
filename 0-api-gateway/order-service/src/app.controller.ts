/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Trả danh sách order từ bộ nhớ cho Kong Gateway routing test.
     * (EN: Returns order list from memory for Kong Gateway routing test.)
     */
    @Get()
    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getOrders`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getOrders`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getOrders() {
        this.logger.log("Received request to fetch orders")
        return this.appService.getOrders()
    }
