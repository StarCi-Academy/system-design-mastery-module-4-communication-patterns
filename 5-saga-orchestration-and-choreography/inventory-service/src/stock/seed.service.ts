/**
 * Service logic chính của lesson — mọi method có JSDoc Logic + Code.
 * (EN: Core lesson service — methods documented with Logic + Code.)
 */
import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductEntity } from "../entities";

@Injectable()
/**
 * Class `SeedService` — thành phần lab (controller/service/module).
 * (EN: Class `SeedService` — lesson lab component.)
 */
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.products.count();/**
 * Logic — Xử lý nghiệp vụ `if` cho lab.
 * Code — `if()` — logic trong service/controller.
 * (EN Logic: Business handler `if` for the lab.)
 * (EN Code: `if()` — in-class handler logic.)
 */
    if (count > 0) {
      return;
    }
    await this.products.save([
      { id: 1, stock: 0 },
      { id: 2, stock: 50 },
    ]);
  }
}
