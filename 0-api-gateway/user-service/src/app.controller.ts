import {
    Controller,
    Get,
    Logger,
} from "@nestjs/common"
import {
    AppService,
} from "./app.service"

@Controller("users")
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    @Get()
    getUsers() {
        this.logger.log("Received request to fetch users")
        return this.appService.getUsers()
    }
}
