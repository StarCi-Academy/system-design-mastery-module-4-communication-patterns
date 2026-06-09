import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "fulfillments" })
export class FulfillmentEntity {
  @PrimaryColumn()
  orderId!: number;

  @Column({ default: "DONE" })
  status!: string;
}
