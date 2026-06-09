/**
 * User controller — exposes POST /users and GET /users.
 * The service does not know it sits behind Kong; it handles plain HTTP.
 * (EN: Controller that demonstrates service-level ignorance of the gateway.)
 */
import {
    Body,
    Controller,
    Get,
    Post,
} from "@nestjs/common"
import {
    AppService,
    CreateUserInput,
    User,
} from "./app.service"

@Controller("users")
/**
 * Class `AppController` — REST controller for user resource.
 * Handles POST (create) and GET (list) delegating to `AppService`.
 */
export class AppController {
    constructor(private readonly appService: AppService) {}

    /**
     * Create a new user and return it with HTTP 201.
     * Nest returns 201 by default for @Post handlers.
     * @param body - Name and email from the request body.
     * @returns The newly created user.
     */
    @Post()
    create(@Body() body: CreateUserInput): User {
        // POST /users → Nest returns HTTP 201 by default; gateway relays it verbatim.
        return this.appService.create(body)
    }

    /**
     * Return the list of all users.
     * @returns Array of all users created so far (HTTP 200).
     */
    @Get()
    list(): User[] {
        return this.appService.list()
    }
}
