/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — nhận request gRPC `GetUser`, trả user từ bộ nhớ.
     * Code — `@GrpcMethod` map tới `UserService.GetUser` trong proto.
     * (EN Logic: Receives gRPC `GetUser` request, returns user from memory.)
     * (EN Code: `@GrpcMethod` maps to `UserService.GetUser` in proto.)
     */
    @GrpcMethod("UserService", "GetUser")/**
 * Logic — Đọc/truy vấn dữ liệu qua `getUser`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getUser`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getUser(data: { id: number }) {
        this.logger.log(`gRPC GetUser id=${data.id}`)
        return this.appService.getUser(data.id)
    }
