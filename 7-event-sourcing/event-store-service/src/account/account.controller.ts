/**
 * AccountController — REST API cho Event Store Service.
 *
 * Endpoints:
 *   POST   /accounts                      — mở tài khoản mới (OpenAccount command)
 *   POST   /accounts/:id/deposit          — nạp tiền (Deposit command)
 *   POST   /accounts/:id/withdraw         — rút tiền (Withdraw command)
 *   POST   /accounts/:id/close            — đóng tài khoản (Close command)
 *   GET    /accounts/:id                  — projection hiện tại (read model)
 *   GET    /accounts/:id/events           — event log thô (audit / time-travel)
 *   GET    /accounts/:id/state-at/:ver    — state tại version cụ thể (time-travel)
 *   POST   /accounts/:id/snapshots        — tạo snapshot thủ công
 *   POST   /projections/rebuild           — rebuild tất cả projections
 *
 * (EN: AccountController — REST API for the Event Store Service.
 *
 * Endpoints:
 *   POST   /accounts                      — open new account (OpenAccount command)
 *   POST   /accounts/:id/deposit          — deposit money (Deposit command)
 *   POST   /accounts/:id/withdraw         — withdraw money (Withdraw command)
 *   POST   /accounts/:id/close            — close account (Close command)
 *   GET    /accounts/:id                  — current projection (read model)
 *   GET    /accounts/:id/events           — raw event log (audit / time-travel)
 *   GET    /accounts/:id/state-at/:ver    — state at specific version (time-travel)
 *   POST   /accounts/:id/snapshots        — take manual snapshot
 *   POST   /projections/rebuild           — rebuild all projections)
 */
import {
    Body,
    Controller,
    Get,
    Logger,
    Param,
    ParseIntPipe,
    Post,
} from "@nestjs/common"
import {
    AccountService,
} from "./account.service"
import {
    CloseAccountCommand,
    DepositMoneyCommand,
    OpenAccountCommand,
    WithdrawMoneyCommand,
} from "./commands"

@Controller()
export class AccountController {
    private readonly logger = new Logger(AccountController.name)

    constructor(private readonly accountService: AccountService) {}

    // ─── Commands ────────────────────────────────────────────────────────────

    /**
     * POST /accounts — mở tài khoản mới.
     * Body: { owner: string, initialBalance: number }
     * (EN: Open a new account.)
     */
    @Post("accounts")
    async openAccount(@Body() cmd: OpenAccountCommand): Promise<{ accountId: string }> {
        this.logger.log(`POST /accounts owner=${cmd.owner}`)
        return this.accountService.openAccount(cmd)
    }

    /**
     * POST /accounts/:id/deposit — nạp tiền.
     * Body: { amount: number }
     * (EN: Deposit money into account.)
     */
    @Post("accounts/:id/deposit")
    async deposit(
        @Param("id") id: string,
        @Body() cmd: DepositMoneyCommand,
    ) {
        this.logger.log(`POST /accounts/${id}/deposit amount=${cmd.amount}`)
        return this.accountService.deposit(id, cmd)
    }

    /**
     * POST /accounts/:id/withdraw — rút tiền.
     * Body: { amount: number }
     * (EN: Withdraw money from account.)
     */
    @Post("accounts/:id/withdraw")
    async withdraw(
        @Param("id") id: string,
        @Body() cmd: WithdrawMoneyCommand,
    ) {
        this.logger.log(`POST /accounts/${id}/withdraw amount=${cmd.amount}`)
        return this.accountService.withdraw(id, cmd)
    }

    /**
     * POST /accounts/:id/close — đóng tài khoản.
     * Body: { reason: string }
     * (EN: Close an account.)
     */
    @Post("accounts/:id/close")
    async close(
        @Param("id") id: string,
        @Body() cmd: CloseAccountCommand,
    ) {
        this.logger.log(`POST /accounts/${id}/close reason=${cmd.reason}`)
        return this.accountService.closeAccount(id, cmd)
    }

    // ─── Queries ─────────────────────────────────────────────────────────────

    /**
     * GET /accounts/:id — trả về projection hiện tại (replay event log → AccountState).
     * (EN: Return current projection (replay event log → AccountState).)
     */
    @Get("accounts/:id")
    async getProjection(@Param("id") id: string) {
        this.logger.log(`GET /accounts/${id}`)
        return this.accountService.getProjection(id)
    }

    /**
     * GET /accounts/:id/events — trả về toàn bộ event log thô (audit trail).
     * (EN: Return full raw event log (audit trail).)
     */
    @Get("accounts/:id/events")
    async getEventLog(@Param("id") id: string) {
        this.logger.log(`GET /accounts/${id}/events`)
        return this.accountService.getEventLog(id)
    }

    /**
     * GET /accounts/:id/state-at/:version — time-travel: state tại version cụ thể.
     * (EN: Time-travel: state at a specific version.)
     */
    @Get("accounts/:id/state-at/:version")
    async getStateAtVersion(
        @Param("id") id: string,
        @Param("version", ParseIntPipe) version: number,
    ) {
        this.logger.log(`GET /accounts/${id}/state-at/${version}`)
        return this.accountService.getStateAtVersion(id, version)
    }

    /**
     * POST /accounts/:id/snapshots — tạo snapshot thủ công cho account.
     * (EN: Manually take a snapshot for the account.)
     */
    @Post("accounts/:id/snapshots")
    async takeSnapshot(@Param("id") id: string) {
        this.logger.log(`POST /accounts/${id}/snapshots`)
        return this.accountService.takeSnapshot(id)
    }

    // ─── Projection management ───────────────────────────────────────────────

    /**
     * POST /projections/rebuild — rebuild tất cả projections (demo: derived data can be rebuilt).
     * (EN: Rebuild all projections (demo: derived data can be rebuilt at any time).)
     */
    @Post("projections/rebuild")
    async rebuildAll() {
        this.logger.log("POST /projections/rebuild")
        return this.accountService.rebuildAllProjections()
    }
}
