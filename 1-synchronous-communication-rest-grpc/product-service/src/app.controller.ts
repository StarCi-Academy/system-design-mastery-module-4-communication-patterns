/**
 * gRPC controller Product Service — nhận request gRPC, delegate sang service.
 * (EN: gRPC Product Service controller — receives gRPC requests, delegates to service.)
 */
import {
    Controller,
    Logger,
} from "@nestjs/common"
import {
    GrpcMethod,
} from "@nestjs/microservices"
import {
    AppService,
} from "./app.service"

/**
 * Class `AppController` — thành phần lab (controller/service/module).
 * (EN: Class `AppController` — lesson lab component.)
 */
@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    /**
     * Logic — nhận request gRPC `GetProduct`, trả product từ bộ nhớ.
     * Code — `@GrpcMethod` map tới `ProductService.GetProduct` trong proto.
     * (EN Logic: Receives gRPC `GetProduct` request, returns product from memory.)
     * (EN Code: `@GrpcMethod` maps to `ProductService.GetProduct` in proto.)
     */
    @GrpcMethod("ProductService", "GetProduct")
    getProduct(data: { id: number }) {
        // Log ID nhận được để xác nhận request đi đúng handler.
        // (EN: Log received ID to confirm request reaches correct handler.)
        this.logger.log(`gRPC GetProduct id=${data.id}`)
        // Delegate sang service để tách logic truy vấn khỏi layer transport.
        // (EN: Delegate to service to separate query logic from transport layer.)
        return this.appService.getProduct(data.id)
    }
}
