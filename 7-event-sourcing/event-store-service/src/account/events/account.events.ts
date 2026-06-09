/**
 * Domain events cho aggregate Account.
 * Mỗi event là một fact bất biến đã xảy ra trong hệ thống.
 * (EN: Domain events for the Account aggregate.
 * Each event is an immutable fact that already happened in the system.)
 */

/** Event: tài khoản được mở lần đầu. (EN: Account was opened.) */
export interface AccountOpenedEvent {
    readonly type: "AccountOpened"
    readonly accountId: string
    readonly owner: string
    readonly initialBalance: number
}

/** Event: tiền được nạp vào tài khoản. (EN: Money was deposited.) */
export interface MoneyDepositedEvent {
    readonly type: "MoneyDeposited"
    readonly accountId: string
    readonly amount: number
}

/** Event: tiền được rút từ tài khoản. (EN: Money was withdrawn.) */
export interface MoneyWithdrawnEvent {
    readonly type: "MoneyWithdrawn"
    readonly accountId: string
    readonly amount: number
}

/** Event: tài khoản bị đóng. (EN: Account was closed.) */
export interface AccountClosedEvent {
    readonly type: "AccountClosed"
    readonly accountId: string
    readonly reason: string
}

/**
 * Union tất cả domain events của Account.
 * (EN: Union of all Account domain events.)
 */
export type AccountDomainEvent =
    | AccountOpenedEvent
    | MoneyDepositedEvent
    | MoneyWithdrawnEvent
    | AccountClosedEvent

/** Tên event hợp lệ. (EN: Valid event type names.) */
export type AccountEventType = AccountDomainEvent["type"]

export const ACCOUNT_EVENT_TYPES: AccountEventType[] = [
    "AccountOpened",
    "MoneyDeposited",
    "MoneyWithdrawn",
    "AccountClosed",
]
