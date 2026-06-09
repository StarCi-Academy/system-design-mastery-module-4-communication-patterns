/**
 * Entity `EventRecord` — một hàng trong bảng `events` (append-only event log).
 * Mỗi hàng là một domain event bất biến; KHÔNG BAO GIỜ cập nhật hay xóa.
 * (EN: Entity `EventRecord` — one row in the `events` table (append-only event log).
 * Each row is an immutable domain event; NEVER update or delete.)
 */
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "typeorm"

@Entity("events")
@Index(["aggregateId", "version"], { unique: true })
export class EventRecord {
    /**
     * Khóa chính tự tăng — chỉ dùng làm cursor phân trang.
     * (EN: Auto-increment PK — used only as a pagination cursor.)
     */
    @PrimaryGeneratedColumn()
        id!: number

    /**
     * ID của aggregate (vd: accountId).
     * (EN: Aggregate ID (e.g., accountId).)
     */
    @Column({ name: "aggregate_id", type: "varchar", length: 100 })
    @Index()
        aggregateId!: string

    /**
     * Loại aggregate (vd: "Account").
     * (EN: Aggregate type (e.g., "Account").)
     */
    @Column({ name: "aggregate_type", type: "varchar", length: 100 })
        aggregateType!: string

    /**
     * Phiên bản monotonic của event trong một aggregate — bắt đầu từ 1.
     * Unique cùng với aggregateId để phát hiện xung đột concurrent-write.
     * (EN: Monotonic version of the event within an aggregate — starts at 1.
     * Unique together with aggregateId to detect concurrent-write conflicts.)
     */
    @Column({ type: "int" })
        version!: number

    /**
     * Tên event (vd: "AccountOpened", "MoneyDeposited").
     * (EN: Event name (e.g., "AccountOpened", "MoneyDeposited").)
     */
    @Column({ name: "event_type", type: "varchar", length: 100 })
        eventType!: string

    /**
     * Payload JSON của event — dữ liệu nghiệp vụ bất biến.
     * (EN: JSON payload of the event — immutable business data.)
     */
    @Column({ name: "payload", type: "jsonb" })
        payload!: Record<string, unknown>

    /**
     * Thời điểm event được ghi — do DB gán, không thể ghi đè.
     * (EN: Timestamp when the event was written — set by DB, cannot be overridden.)
     */
    @CreateDateColumn({ name: "occurred_at" })
        occurredAt!: Date
}
