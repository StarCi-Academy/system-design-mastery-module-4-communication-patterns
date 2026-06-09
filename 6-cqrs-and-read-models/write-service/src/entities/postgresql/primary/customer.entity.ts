import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'customers' })
export class Customer {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;
}
