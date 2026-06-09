/**
 * Pure projection function — fold event log → AccountState (read model).
 * Hàm này KHÔNG có side effects, không truy cập DB; chỉ nhận danh sách event và trả về state.
 * (EN: Pure projection function — fold event log → AccountState (read model).
 * This function has NO side effects, no DB access; takes event list and returns state.)
 */
import type {
    AccountDomainEvent,
} from "../events"

/**
 * Trạng thái hiện tại của một Account — được tính lại từ event log.
 * (EN: Current state of an Account — computed by replaying the event log.)
 */
export interface AccountState {
    /** ID tài khoản. (EN: Account ID.) */
    accountId: string
    /** Chủ tài khoản. (EN: Account owner.) */
    owner: string
    /** Số dư hiện tại. (EN: Current balance.) */
    balance: number
    /** Trạng thái: open | closed. (EN: Status: open | closed.) */
    status: "open" | "closed"
    /** Version = số events đã được apply. (EN: Version = number of events applied.) */
    version: number
    /** Thời điểm event đầu tiên (mở TK). (EN: Timestamp of the first event (account opened).) */
    openedAt: Date | null
    /** Thời điểm event cuối cùng được apply. (EN: Timestamp of the last applied event.) */
    lastEventAt: Date | null
}

/**
 * Trạng thái rỗng cho aggregate chưa có event nào.
 * (EN: Empty state for an aggregate with no events yet.)
 */
export function emptyAccountState(accountId: string): AccountState {
    return {
        accountId,
        owner: "",
        balance: 0,
        status: "open",
        version: 0,
        openedAt: null,
        lastEventAt: null,
    }
}

/**
 * Apply một event đơn lẻ vào state hiện tại → trả state mới (immutable fold step).
 * Logic — switch theo eventType, cập nhật field tương ứng.
 * Code — pure function, không mutate tham số đầu vào.
 * (EN: Apply a single event onto current state → return new state (immutable fold step).
 * Logic — switch on eventType, update the corresponding field.
 * Code — pure function, does not mutate input.)
 *
 * @param state - Trạng thái hiện tại. (EN: Current state.)
 * @param event - Event cần apply. (EN: Event to apply.)
 * @param occurredAt - Thời điểm event xảy ra. (EN: When the event occurred.)
 * @param version - Version của event. (EN: Event version.)
 */
export function applyEvent(
    state: AccountState,
    event: AccountDomainEvent,
    occurredAt: Date,
    version: number,
): AccountState {
    const next: AccountState = { ...state, version, lastEventAt: occurredAt }
    switch (event.type) {
    case "AccountOpened":
        return {
            ...next,
            owner: event.owner,
            balance: event.initialBalance,
            status: "open",
            openedAt: occurredAt,
        }
    case "MoneyDeposited":
        return { ...next, balance: state.balance + event.amount }
    case "MoneyWithdrawn":
        return { ...next, balance: state.balance - event.amount }
    case "AccountClosed":
        return { ...next, status: "closed" }
    }
}

/**
 * Replay toàn bộ event log → AccountState cuối cùng.
 * Logic — foldLeft trên mảng event từ version thấp đến cao.
 * Code — `events.reduce(applyEvent, initial)`.
 * (EN: Replay the full event log → final AccountState.
 * Logic — foldLeft over sorted event array low-to-high version.
 * Code — `events.reduce(applyEvent, initial)`.)
 *
 * @param accountId - ID dùng để khởi tạo trạng thái rỗng. (EN: ID used to init empty state.)
 * @param events - Danh sách raw event records đã sort theo version ASC. (EN: Sorted event records ASC version.)
 */
export function replayEvents(
    accountId: string,
    events: Array<{ payload: Record<string, unknown>; occurredAt: Date; version: number }>,
): AccountState {
    let state = emptyAccountState(accountId)
    for (const row of events) {
        state = applyEvent(
            state,
            row.payload as unknown as AccountDomainEvent,
            row.occurredAt,
            row.version,
        )
    }
    return state
}
