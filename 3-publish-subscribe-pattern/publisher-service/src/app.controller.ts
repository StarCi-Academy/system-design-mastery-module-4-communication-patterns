/**
 * HTTP controller — routes delegate to AppService.
 * (EN: HTTP controller — routes delegate to AppService.)
 */
import {
    Body,
    Controller,
    Logger,
    Post,
} from "@nestjs/common"
import type {
    PublishRequestBody,
    PublishResponse,
} from "./types"
import {
    AppService,
} from "./app.service"

/**
 * Class `AppController` — REST entry point, delegates to AppService.
 * (EN: Class `AppController` — REST entry point, delegates to AppService.)
 */
@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    /**
     * Logic — nhận POST /publish, gọi service emit event NATS trên topic `app.events`.
     * Code — `@Post("publish")` map endpoint, uỷ thác cho `AppService.publish`.
     * (EN Logic: Receives POST /publish, calls service to emit NATS event on `app.events` topic.)
     * (EN Code: `@Post("publish")` maps endpoint, delegates to `AppService.publish`.)
     */
    @Post("publish")
    publish(@Body() body: PublishRequestBody): Promise<PublishResponse> {
        this.logger.log("Received publish request")
        return this.appService.publish(body)
    }
}
