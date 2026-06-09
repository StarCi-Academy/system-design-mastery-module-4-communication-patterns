/**
 * User Service — manages users in memory (no DB required for gateway demo).
 * (EN: User Service — in-memory data store to demonstrate Kong Gateway routing.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

/** Shape of a user resource. */
export interface User {
    /** Auto-increment integer id assigned by the service. */
    id: number
    /** Display name of the user. */
    name: string
    /** Email address of the user. */
    email: string
}

/** Input body for creating a new user. */
export interface CreateUserInput {
    /** Display name submitted by the client. */
    name: string
    /** Email address submitted by the client. */
    email: string
}

@Injectable()
/**
 * Class `AppService` — holds user state and exposes create / list operations.
 * (EN: In-memory data source; demonstrates that business logic lives in the service, not the gateway.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /** In-memory user list. Grows with each POST /users call. */
    private readonly users: User[] = []

    /** Auto-increment counter — incremented before each insert so ids start at 1. */
    private counter = 0

    /**
     * Create a new user and append it to the in-memory list.
     * @param input - Name and email from the request body.
     * @returns The newly created user with its assigned id.
     */
    create(input: CreateUserInput): User {
        // Increment counter first so the first id is 1, not 0.
        const created: User = {
            id: ++this.counter,
            name: input.name,
            email: input.email,
        }
        // Persist in memory; visible to subsequent GET /users calls.
        this.users.push(created)
        this.logger.log(`Created user id=${created.id}`)
        return created
    }

    /**
     * Return the full list of users created so far.
     * @returns Snapshot array of all in-memory users.
     */
    list(): User[] {
        this.logger.log("Listing users")
        // Return a shallow copy so callers cannot mutate the internal array.
        return [...this.users]
    }
}
