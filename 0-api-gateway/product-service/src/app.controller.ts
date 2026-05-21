/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Trả danh sách product từ bộ nhớ cho Kong Gateway routing test.
     * (EN: Returns product list from memory for Kong Gateway routing test.)
     */
    @Get()
    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getProducts`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getProducts`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getProducts() {
        this.logger.log("Received request to fetch products")
        return this.appService.getProducts()
    }
