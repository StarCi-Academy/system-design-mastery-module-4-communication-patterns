/**
 * gRPC controller User Service — nhận request gRPC, delegate sang service.
 * (EN: gRPC User Service controller — receives gRPC requests, delegates to service.)
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
     * Logic — nhận request gRPC `GetUser`, trả user từ bộ nhớ.
     * Code — `@GrpcMethod` map tới `UserService.GetUser` trong proto.
     * (EN Logic: Receives gRPC `GetUser` request, returns user from memory.)
     * (EN Code: `@GrpcMethod` maps to `UserService.GetUser` in proto.)
     */
    @GrpcMethod("UserService", "GetUser")
    getUser(data: { id: number }) {
        // Log ID nhận được để xác nhận request đi đúng handler.
        // (EN: Log received ID to confirm request reaches correct handler.)
        this.logger.log(`gRPC GetUser id=${data.id}`)
        // Delegate sang service để tách logic truy vấn khỏi layer transport.
        // (EN: Delegate to service to separate query logic from transport layer.)
        return this.appService.getUser(data.id)
    }
}
