import {
    Column, Entity, PrimaryColumn 
} from "typeorm"

@Entity({
    name: "products" 
})
export class ProductEntity {
  @PrimaryColumn()
      id!: number

  @Column()
      stock!: number
}
