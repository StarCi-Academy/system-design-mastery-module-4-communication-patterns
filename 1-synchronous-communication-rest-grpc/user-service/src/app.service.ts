/**
 * Service User — dữ liệu mock user trong bộ nhớ cho gRPC backend.
 * (EN: User Service — mock user data in memory for gRPC backend.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

export interface User {
    id: number
    name: string
    email: string
}

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    private readonly users: User[] = [
        { id: 1, name: "Alice", email: "alice@starci.com" },
        { id: 2, name: "Bob", email: "bob@starci.com" },
    ]

    /**
     * Logic — tra cứu user theo ID, trả default nếu không tìm thấy.
     * Code — `Array.find()` trên mảng hardcoded, fallback `{ id: 0 }`.
     * (EN Logic: Looks up user by ID, returns default if not found.)
     * (EN Code: `Array.find()` on hardcoded array, fallback `{ id: 0 }`.)
     */
    getUser(id: number): User {
        this.logger.log(`Fetching user from memory for id: ${id}`)
        return this.users.find(u => u.id === id) || { id: 0, name: "Not Found", email: "" }
    }
}
