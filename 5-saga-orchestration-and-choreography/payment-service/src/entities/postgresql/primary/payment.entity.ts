import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "payments" })
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  orderId!: number;

  @Column()
  productId!: number;

  @Column()
  quantity!: number;

  @Column({ type: "varchar" })
  status!: "CAPTURED" | "REFUNDED";
}
