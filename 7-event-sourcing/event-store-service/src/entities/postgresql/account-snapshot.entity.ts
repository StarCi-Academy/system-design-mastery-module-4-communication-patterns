/**
 * Entity `AccountSnapshot` — snapshot trạng thái account tại một version cụ thể.
 * Giúp tối ưu replay: thay vì replay toàn bộ log, chỉ replay từ snapshot mới nhất.
 * (EN: Entity `AccountSnapshot` — snapshot of account state at a specific version.
 * Optimises replay: instead of replaying the full log, replay only from the latest snapshot.)
 */
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "typeorm"

@Entity("account_snapshots")
@Index(["accountId", "version"], { unique: true })
export class AccountSnapshot {
    @PrimaryGeneratedColumn()
        id!: number

    /**
     * ID của account mà snapshot thuộc về.
     * (EN: ID of the account this snapshot belongs to.)
     */
    @Column({ name: "account_id", type: "varchar", length: 100 })
    @Index()
        accountId!: string

    /**
     * Version của event cuối cùng được tích lũy vào snapshot này.
     * (EN: Version of the last event folded into this snapshot.)
     */
    @Column({ type: "int" })
        version!: number

    /**
     * Trạng thái đầy đủ của account tại version này (dạng JSON).
     * (EN: Full account state at this version (as JSON).)
     */
    @Column({ type: "jsonb" })
        state!: Record<string, unknown>

    @CreateDateColumn({ name: "snapshotted_at" })
        snapshottedAt!: Date
}
