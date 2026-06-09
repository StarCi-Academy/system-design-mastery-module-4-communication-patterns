/**
 * Service logic chính của lesson — mọi method có JSDoc Logic + Code.
 * (EN: Core lesson service — methods documented with Logic + Code.)
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

const INDEX = 'customers';

@Injectable()
/**
 * Class `ElasticsearchService` — thành phần lab (controller/service/module).
 * (EN: Class `ElasticsearchService` — lesson lab component.)
 */
export class ElasticsearchService implements OnModuleInit {
  private client!: Client;

  async onModuleInit() {
    const node =
      process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
    this.client = new Client({ node });
    try {
      await this.client.indices.create({
        index: INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text' },
            email: { type: 'keyword' },
          },
        },
      });
    } catch (e) {
      const status = (e as { meta?: { statusCode?: number } })?.meta?.statusCode;
      if (status !== 400) throw e;
    }
  }

  async upsertCustomer(doc: { id: string; name: string; email: string }) {
    await this.client.index({
      index: INDEX,
      id: doc.id,
      document: doc,
      refresh: true,
    });
  }

  async getById(id: string) {
    try {
      const res = await this.client.get<{ id: string; name: string; email: string }>(
        { index: INDEX, id },
      );
      return res._source;
    } catch {
      return null;
    }
  }
}
