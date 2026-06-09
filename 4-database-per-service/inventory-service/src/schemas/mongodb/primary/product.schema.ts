/**
 * Mongoose schema cho sản phẩm — collection `products` trong MongoDB.
 * (EN: Mongoose schema for products — `products` collection in MongoDB.)
 */
import {
    Prop,
    Schema,
    SchemaFactory,
} from "@nestjs/mongoose"
import {
    HydratedDocument,
} from "mongoose"

export type ProductDocument = HydratedDocument<Product>

@Schema({ collection: "products" })
export class Product {
    @Prop({ required: true })
    name!: string

    @Prop({ required: true })
    stock!: number
}

export const ProductSchema = SchemaFactory.createForClass(Product)
