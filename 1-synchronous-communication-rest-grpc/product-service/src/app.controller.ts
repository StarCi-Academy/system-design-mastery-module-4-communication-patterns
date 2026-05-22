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

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    @GrpcMethod("ProductService", "GetProduct")
    getProduct(data: { id: number }) {
        this.logger.log(`gRPC GetProduct id=${data.id}`)
        return this.appService.getProduct(data.id)
    }
}
