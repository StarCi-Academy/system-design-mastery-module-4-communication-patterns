/**
 * Entity đơn hàng — bảng `orders` trong PostgreSQL.
 * (EN: Order entity — `orders` table in PostgreSQL.)
 */
import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm"

@Entity({ name: "orders" })
export class Order {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    customerId!: string

    @Column({ type: "decimal", precision: 12, scale: 2 })
    totalAmount!: string
}
