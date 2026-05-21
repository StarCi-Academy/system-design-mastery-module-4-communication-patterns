/**
 * Service User — dữ liệu mock user trong bộ nhớ (không cần DB).
 * (EN: User Service — mock user data in memory (no DB required).)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

export type User = { id: number; name: string; email: string }

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /**
     * Logic — trả mock data user để kiểm thử Kong Gateway routing.
     * Code — trả mảng User[] hardcoded.
     * (EN Logic: Returns mock user data for Kong Gateway routing test.)
     * (EN Code: Returns hardcoded User[] array.)
     */
    getUsers(): User[] {
        this.logger.log("Fetching users from memory")
        return [
            { id: 1, name: "Alice", email: "alice@starci.com" },
            { id: 2, name: "Bob", email: "bob@starci.com" },
        ]
    }
}
