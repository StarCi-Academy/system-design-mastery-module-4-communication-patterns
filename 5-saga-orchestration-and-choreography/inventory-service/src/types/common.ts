/**
 * Kiểu dùng chung trong lesson (response, params).
 * (EN: Shared lesson types (responses, params).)
 */
export interface ApiMessageResponse {
    /**
     * Trạng thái xử lý.
     * (EN: Processing status.)
     */
    status: string
    /**
     * Thông báo mô tả kết quả.
     * (EN: Human-readable result message.)
     */
    message?: string
}

/**
 * Kết quả bước kiểm tra/trừ kho của saga.
 * (EN: Result of the inventory check/reserve saga step.)
 */
export interface InventoryCheckResult {
    /**
     * Bước inventory thành công hay không.
     * (EN: Whether the inventory step succeeded.)
     */
    ok: boolean
    orderId: number
    productId: number
    quantity: number
    /**
     * FULFILLED | OUT_OF_STOCK | ALREADY_FULFILLED.
     * (EN: FULFILLED | OUT_OF_STOCK | ALREADY_FULFILLED.)
     */
    status: string
    message: string
    /**
     * Tồn kho còn lại sau thao tác (nếu có).
     * (EN: Remaining stock after the operation, if any.)
     */
    remainingStock?: number
}
