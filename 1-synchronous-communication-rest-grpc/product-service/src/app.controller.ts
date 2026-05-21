/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — nhận request gRPC `GetProduct`, trả product từ bộ nhớ.
     * Code — `@GrpcMethod` map tới `ProductService.GetProduct` trong proto.
     * (EN Logic: Receives gRPC `GetProduct` request, returns product from memory.)
     * (EN Code: `@GrpcMethod` maps to `ProductService.GetProduct` in proto.)
     */
    @GrpcMethod("ProductService", "GetProduct")/**
 * Logic — Đọc/truy vấn dữ liệu qua `getProduct`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getProduct`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getProduct(data: { id: number }) {
        this.logger.log(`gRPC GetProduct id=${data.id}`)
        return this.appService.getProduct(data.id)
    }
