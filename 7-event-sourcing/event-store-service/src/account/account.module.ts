/**
 * Nest feature module — đăng ký controller/service/providers cho Account domain.
 * (EN: Nest feature module — registers controllers/services/providers for Account domain.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    AccountController,
} from "./account.controller"
import {
    AccountService,
} from "./account.service"
import {
    AccountSnapshot,
    EventRecord,
} from "../entities"

@Module({
    imports: [
        TypeOrmModule.forFeature([EventRecord, AccountSnapshot]),
    ],
    controllers: [AccountController],
    providers: [AccountService],
})
/**
 * Class `AccountModule` — thành phần lab (controller/service/module).
 * (EN: Class `AccountModule` — lesson lab component.)
 */
export class AccountModule {}
