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

    @GrpcMethod("UserService", "GetUser")
    getUser(data: { id: number }) {
        this.logger.log(`gRPC GetUser id=${data.id}`)
        return this.appService.getUser(data.id)
    }
}
