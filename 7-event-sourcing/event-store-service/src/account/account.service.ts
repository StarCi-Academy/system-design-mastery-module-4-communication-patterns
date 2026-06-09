/**
 * AccountService — xử lý commands và queries cho Event Store.
 *
 * Các luồng chính:
 *   1. appendEvent   — nhận command → validate → append event row vào Postgres.
 *   2. getProjection — đọc event log từ DB → replay → trả AccountState (read model).
 *   3. rebuildAll    — replay toàn bộ event log cho tất cả accounts → log kết quả.
 *   4. takeSnapshot  — tính AccountState hiện tại → lưu AccountSnapshot vào DB.
 *
 * (EN: AccountService — processes commands and queries for the Event Store.
 *
 * Main flows:
 *   1. appendEvent   — receive command → validate → append event row to Postgres.
 *   2. getProjection — load event log from DB → replay → return AccountState (read model).
 *   3. rebuildAll    — replay full event log for all accounts → log results.
 *   4. takeSnapshot  — compute current AccountState → persist AccountSnapshot.)
 */
import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
    DataSource,
} from "typeorm"
import {
    AccountSnapshot,
    EventRecord,
} from "../entities"
import type {
    AccountDomainEvent,
} from "./events"
import type {
    CloseAccountCommand,
    DepositMoneyCommand,
    OpenAccountCommand,
    WithdrawMoneyCommand,
} from "./commands"
import {
    applyEvent,
    replayEvents,
} from "./handlers"
import type {
    AccountState,
} from "./handlers"

/** Mỗi bao nhiêu events thì tự động tạo snapshot. (EN: Auto-snapshot every N events.) */
const SNAPSHOT_THRESHOLD = 10

@Injectable()
export class AccountService {
    private readonly logger = new Logger(AccountService.name)

    constructor(
        @InjectRepository(EventRecord)
        private readonly eventRepo: Repository<EventRecord>,
        @InjectRepository(AccountSnapshot)
        private readonly snapshotRepo: Repository<AccountSnapshot>,
        private readonly dataSource: DataSource,
    ) {}

    // ─── Commands ────────────────────────────────────────────────────────────

    /**
     * Mở tài khoản mới — append event "AccountOpened".
     * Logic — tạo accountId random, append event version 1.
     * Code — `_appendEvent(accountId, "Account", "AccountOpened", payload)`.
     * (EN: Open a new account — append "AccountOpened" event.
     * Logic — generate random accountId, append event at version 1.
     * Code — `_appendEvent(accountId, "Account", "AccountOpened", payload)`.)
     */
    async openAccount(cmd: OpenAccountCommand): Promise<{ accountId: string }> {
        const accountId = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const payload: AccountDomainEvent = {
            type: "AccountOpened",
            accountId,
            owner: cmd.owner,
            initialBalance: cmd.initialBalance,
        }
        await this._appendEvent(accountId, "Account", payload)
        this.logger.log(`AccountOpened: ${accountId} owner=${cmd.owner}`)
        return { accountId }
    }

    /**
     * Nạp tiền — append event "MoneyDeposited".
     * (EN: Deposit money — append "MoneyDeposited" event.)
     */
    async deposit(accountId: string, cmd: DepositMoneyCommand): Promise<AccountState> {
        const state = await this._loadState(accountId)
        if (state.status === "closed") {
            throw new BadRequestException(`Account ${accountId} is closed`)
        }
        const payload: AccountDomainEvent = {
            type: "MoneyDeposited",
            accountId,
            amount: cmd.amount,
        }
        await this._appendEvent(accountId, "Account", payload)
        return this._loadState(accountId)
    }

    /**
     * Rút tiền — validate số dư, append event "MoneyWithdrawn".
     * (EN: Withdraw money — validate balance, append "MoneyWithdrawn" event.)
     */
    async withdraw(accountId: string, cmd: WithdrawMoneyCommand): Promise<AccountState> {
        const state = await this._loadState(accountId)
        if (state.status === "closed") {
            throw new BadRequestException(`Account ${accountId} is closed`)
        }
        if (state.balance < cmd.amount) {
            throw new BadRequestException(
                `Insufficient balance: ${state.balance} < ${cmd.amount}`,
            )
        }
        const payload: AccountDomainEvent = {
            type: "MoneyWithdrawn",
            accountId,
            amount: cmd.amount,
        }
        await this._appendEvent(accountId, "Account", payload)
        return this._loadState(accountId)
    }

    /**
     * Đóng tài khoản — append event "AccountClosed".
     * (EN: Close account — append "AccountClosed" event.)
     */
    async closeAccount(accountId: string, cmd: CloseAccountCommand): Promise<AccountState> {
        const state = await this._loadState(accountId)
        if (state.status === "closed") {
            throw new BadRequestException(`Account ${accountId} is already closed`)
        }
        const payload: AccountDomainEvent = {
            type: "AccountClosed",
            accountId,
            reason: cmd.reason,
        }
        await this._appendEvent(accountId, "Account", payload)
        return this._loadState(accountId)
    }

    // ─── Queries ─────────────────────────────────────────────────────────────

    /**
     * Trả về AccountState hiện tại (projection) bằng cách replay event log.
     * Nếu có snapshot mới nhất, chỉ replay các event SAU snapshot đó.
     * (EN: Return current AccountState (projection) by replaying the event log.
     * If a snapshot exists, only replay events AFTER that snapshot version.)
     */
    async getProjection(accountId: string): Promise<AccountState> {
        return this._loadState(accountId)
    }

    /**
     * Trả về toàn bộ event log thô của một account (dùng cho time-travel / audit).
     * (EN: Return full raw event log for an account (for time-travel / audit).)
     */
    async getEventLog(accountId: string): Promise<EventRecord[]> {
        const events = await this.eventRepo.find({
            where: { aggregateId: accountId },
            order: { version: "ASC" },
        })
        if (events.length === 0) {
            throw new NotFoundException(`Account ${accountId} not found`)
        }
        return events
    }

    /**
     * Replay state của account tại một version cụ thể (time-travel).
     * (EN: Replay account state at a specific version (time-travel).)
     */
    async getStateAtVersion(accountId: string, version: number): Promise<AccountState> {
        const events = await this.eventRepo.find({
            where: { aggregateId: accountId },
            order: { version: "ASC" },
        })
        const sliced = events.filter(e => e.version <= version)
        if (sliced.length === 0) {
            throw new NotFoundException(
                `Account ${accountId} not found or no events at version ${version}`,
            )
        }
        return replayEvents(accountId, sliced)
    }

    /**
     * Rebuild tất cả projections — replay toàn bộ event log cho từng account, log kết quả.
     * Dùng để demo: "projection là derived data — có thể rebuild bất cứ lúc nào".
     * (EN: Rebuild all projections — replay full event log per account, log results.
     * Used to demo: "projection is derived data — can be rebuilt at any time".)
     */
    async rebuildAllProjections(): Promise<{ rebuilt: number; accounts: AccountState[] }> {
        // Lấy danh sách accountId duy nhất.
        // (EN: Fetch list of distinct accountIds.)
        const rows = await this.dataSource.query<Array<{ aggregate_id: string }>>(
            `SELECT DISTINCT aggregate_id FROM events WHERE aggregate_type = 'Account'`,
        )
        const accounts: AccountState[] = []
        for (const row of rows) {
            const id = row["aggregate_id"] ?? ""
            const state = await this._loadState(id)
            accounts.push(state)
            this.logger.log(
                `Rebuilt projection: ${id} balance=${state.balance} status=${state.status}`,
            )
        }
        return { rebuilt: accounts.length, accounts }
    }

    /**
     * Tạo snapshot cho account (lưu trạng thái hiện tại vào bảng account_snapshots).
     * (EN: Take a snapshot for an account (persist current state to account_snapshots table).)
     */
    async takeSnapshot(accountId: string): Promise<AccountSnapshot> {
        const state = await this._loadState(accountId)
        const existing = await this.snapshotRepo.findOne({
            where: { accountId, version: state.version },
        })
        if (existing) return existing

        const snap = this.snapshotRepo.create({
            accountId,
            version: state.version,
            state: state as unknown as Record<string, unknown>,
        })
        return this.snapshotRepo.save(snap)
    }

    // ─── Internals ───────────────────────────────────────────────────────────

    /**
     * Append một domain event vào bảng events trong một transaction.
     * Dùng SELECT ... FOR UPDATE để đảm bảo version monotonic, tránh xung đột concurrent.
     * (EN: Append one domain event to the events table inside a transaction.
     * Uses SELECT ... FOR UPDATE to guarantee monotonic version and prevent concurrent conflicts.)
     */
    private async _appendEvent(
        aggregateId: string,
        aggregateType: string,
        payload: AccountDomainEvent,
    ): Promise<EventRecord> {
        return this.dataSource.transaction(async manager => {
            // Dùng advisory lock theo hash của aggregateId để serialize concurrent writes cho cùng aggregate.
            // pg_advisory_xact_lock tự giải phóng khi transaction kết thúc.
            // (EN: Use advisory lock hashed from aggregateId to serialise concurrent writes for the same aggregate.
            // pg_advisory_xact_lock is automatically released when the transaction ends.)
            const lockKey = this._hashAggregateId(aggregateId)
            await manager.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey])

            const [maxRow] = await manager.query<Array<{ max: string | null }>>(
                `SELECT MAX(version) AS max FROM events WHERE aggregate_id = $1`,
                [aggregateId],
            )
            const currentMax = maxRow?.["max"] != null ? Number(maxRow["max"]) : 0
            const nextVersion = currentMax + 1

            const record = manager.create(EventRecord, {
                aggregateId,
                aggregateType,
                version: nextVersion,
                eventType: payload.type,
                payload: payload as unknown as Record<string, unknown>,
            })

            const saved = await manager.save(EventRecord, record)

            // Auto-snapshot mỗi SNAPSHOT_THRESHOLD events.
            // (EN: Auto-snapshot every SNAPSHOT_THRESHOLD events.)
            if (nextVersion % SNAPSHOT_THRESHOLD === 0) {
                void this.takeSnapshot(aggregateId).catch(err =>
                    this.logger.warn(`Auto-snapshot failed for ${aggregateId}: ${String(err)}`),
                )
            }

            return saved
        })
    }

    /**
     * Hash aggregateId thành số nguyên 32-bit để dùng làm advisory lock key.
     * (EN: Hash aggregateId to a 32-bit integer for use as an advisory lock key.)
     */
    private _hashAggregateId(aggregateId: string): number {
        let hash = 0
        for (let i = 0; i < aggregateId.length; i++) {
            const chr = aggregateId.charCodeAt(i)
            hash = ((hash << 5) - hash) + chr
            hash |= 0 // Convert to 32-bit integer
        }
        return hash
    }

    /**
     * Load AccountState bằng cách:
     *   1. Tìm snapshot mới nhất (nếu có).
     *   2. Load các events có version > snapshot.version (hoặc toàn bộ nếu không có snapshot).
     *   3. Replay events lên trên snapshot state.
     * (EN: Load AccountState by:
     *   1. Finding latest snapshot (if any).
     *   2. Loading events with version > snapshot.version (or all if no snapshot).
     *   3. Replaying events on top of snapshot state.)
     */
    private async _loadState(accountId: string): Promise<AccountState> {
        // Tìm snapshot mới nhất.
        // (EN: Find latest snapshot.)
        const snapshot = await this.snapshotRepo.findOne({
            where: { accountId },
            order: { version: "DESC" },
        })

        // Load tất cả events sau snapshot (hoặc toàn bộ nếu không có snapshot).
        // (EN: Load all events after snapshot version (or all events if no snapshot).)
        const allEvents = await this.eventRepo.find({
            where: { aggregateId: accountId },
            order: { version: "ASC" },
        })

        if (allEvents.length === 0 && !snapshot) {
            throw new NotFoundException(`Account ${accountId} not found`)
        }

        if (snapshot) {
            // Bắt đầu từ snapshot state, fold thêm các events mới hơn.
            // (EN: Start from snapshot state, fold additional newer events on top.)
            const eventsAfterSnapshot = allEvents.filter(e => e.version > snapshot.version)
            let state = snapshot.state as unknown as AccountState
            for (const row of eventsAfterSnapshot) {
                state = applyEvent(
                    state,
                    row.payload as unknown as AccountDomainEvent,
                    row.occurredAt,
                    row.version,
                )
            }
            return state
        }

        // Không có snapshot — replay từ đầu.
        // (EN: No snapshot — replay from the beginning.)
        return replayEvents(accountId, allEvents)
    }
}
