/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Trả danh sách user từ bộ nhớ cho Kong Gateway routing test.
     * (EN: Returns user list from memory for Kong Gateway routing test.)
     */
    @Get()
    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getUsers`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getUsers`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getUsers() {
        this.logger.log("Received request to fetch users")
        return this.appService.getUsers()
    }
