import {
    Body,
    Controller,
    Logger,
    Post,
} from "@nestjs/common"
import {
    AppService,
} from "./app.service"
import type {
    PublishRequestBody,
    PublishResponse,
} from "./types"

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    @Post("publish")
    publish(@Body() body: PublishRequestBody): Promise<PublishResponse> {
        this.logger.log("Received publish request")
        return this.appService.publish(body)
    }
}
