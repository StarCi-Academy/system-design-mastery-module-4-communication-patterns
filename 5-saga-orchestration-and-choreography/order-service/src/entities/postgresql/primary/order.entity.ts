import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "orders" })
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  productId!: number;

  @Column()
  quantity!: number;

  @Column({ default: "PENDING" })
  status!: string;
}
