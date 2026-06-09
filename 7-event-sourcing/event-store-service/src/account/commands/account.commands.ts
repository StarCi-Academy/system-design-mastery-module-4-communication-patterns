/**
 * Command DTOs — dữ liệu đầu vào cho các lệnh nghiệp vụ của Account.
 * Một command thể hiện ý định ("tôi muốn làm X"), khác với event là fact ("X đã xảy ra").
 * (EN: Command DTOs — input data for Account business commands.
 * A command expresses intent ("I want to do X"), unlike an event which is a fact ("X happened").)
 */
import {
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsString,
    Min,
} from "class-validator"

/** Mở tài khoản mới. (EN: Open a new account.) */
export class OpenAccountCommand {
    /** Chủ tài khoản. (EN: Account owner name.) */
    @IsString()
    @IsNotEmpty()
        owner!: string

    /** Số dư khởi tạo (>= 0). (EN: Initial balance (>= 0).) */
    @IsNumber()
    @Min(0)
        initialBalance!: number
}

/** Nạp tiền. (EN: Deposit money.) */
export class DepositMoneyCommand {
    /** Số tiền nạp (> 0). (EN: Amount to deposit (> 0).) */
    @IsNumber()
    @IsPositive()
        amount!: number
}

/** Rút tiền. (EN: Withdraw money.) */
export class WithdrawMoneyCommand {
    /** Số tiền rút (> 0). (EN: Amount to withdraw (> 0).) */
    @IsNumber()
    @IsPositive()
        amount!: number
}

/** Đóng tài khoản. (EN: Close the account.) */
export class CloseAccountCommand {
    /** Lý do đóng. (EN: Reason for closing.) */
    @IsString()
    @IsNotEmpty()
        reason!: string
}
