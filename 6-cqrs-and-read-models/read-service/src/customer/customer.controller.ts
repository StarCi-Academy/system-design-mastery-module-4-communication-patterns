/**
 * HTTP controller — route demo, delegate sang service.
 * (EN: HTTP controller — demo routes delegating to service.)
 */
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';

@Controller('customer')
/**
 * Class `CustomerController` — thành phần lab (controller/service/module).
 * (EN: Class `CustomerController` — lesson lab component.)
 */
export class CustomerController {
  constructor(private readonly es: ElasticsearchService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    const doc = await this.es.getById(id);
    if (!doc) throw new NotFoundException();
    return doc;
  }
}
