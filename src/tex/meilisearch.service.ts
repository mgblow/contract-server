import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Index, MeiliSearch } from "meilisearch";

export interface PublishDocument {
  id: string;
  userId: string;
  topicId: string;
  text: string;
  _geo: {
    lat: number;
    lng: number;
  };
  createdAt?: number;
}

export interface SearchFilters {
  userId?: string;
  topicId?: string;
  geoRadius?: {
    lat: number;
    lng: number;
    radius: number;
  };
  geoBoundingBox?: {
    topLeft: { lat: number; lng: number };
    bottomRight: { lat: number; lng: number };
  };
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  sort?: string[];
}

@Injectable()
export class MeiliSearchService implements OnModuleInit {
  private readonly logger = new Logger(MeiliSearchService.name);
  private client: MeiliSearch;
  private publishIndex: Index<PublishDocument>;
  private readonly indexName = 'publishes';

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILI_HOST || 'http://127.0.0.1:7700',
      apiKey: process.env.MEILI_API_KEY || '',
    });
  }

  async onModuleInit() {
    await this.initializeIndex();
  }

  private async initializeIndex() {
    try {
      // 1️⃣ Get or create index and set primary key
      const indexes = await this.client.getIndexes();
      const existing = indexes.results.find(i => i.uid === this.indexName);

      if (!existing) {
        await this.client.createIndex(this.indexName, { primaryKey: 'id' });
        this.logger.log(`Created index "${this.indexName}" with primary key 'id'`);
      } else if (!existing.primaryKey) {
        await this.client.index(this.indexName).update({ primaryKey: 'id' });
        this.logger.log(`Updated index "${this.indexName}" to use primary key 'id'`);
      }

      // 2️⃣ Then configure settings
      this.publishIndex = this.client.index<PublishDocument>(this.indexName);
      await this.publishIndex.updateSettings({
        searchableAttributes: ['text', 'userId', 'topicId'],
        filterableAttributes: ['userId', 'topicId', '_geo', 'createdAt'],
        sortableAttributes: ['createdAt'],
        rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
        displayedAttributes: ['id', 'userId', 'topicId', 'text', '_geo', 'createdAt'],
        typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 } },
        pagination: { maxTotalHits: 10000 },
      });

      this.logger.log(`MeiliSearch index "${this.indexName}" initialized`);
    } catch (error) {
      this.logger.error('Failed to initialize MeiliSearch index', error);
      throw error;
    }
  }

  async indexDocument(publish: any): Promise<void> {
    try {
      const document: PublishDocument = this.transformToDocument(publish);
      const result  = await this.publishIndex.addDocuments([document]);
      this.logger.debug(`Indexed document: ${document}`);
      this.logger.debug(`Indexed document: ${result}`);
    } catch (error) {
      this.logger.error(`Failed to index document: ${publish._id}`, error);
      throw error;
    }
  }

  async indexDocuments(publishes: any[]): Promise<void> {
    try {
      const documents = publishes.map(p => this.transformToDocument(p));
      const result = await this.publishIndex.addDocuments(documents);
      this.logger.log(`Indexed ${documents.length} documents. Task: ${result.taskUid}`);
    } catch (error) {
      this.logger.error('Failed to index documents', error);
      throw error;
    }
  }

  async updateDocument(publish: any): Promise<void> {
    try {
      const document = this.transformToDocument(publish);
      await this.publishIndex.updateDocuments([document]);
      this.logger.debug(`Updated document: ${document.id}`);
    } catch (error) {
      this.logger.error(`Failed to update document: ${publish._id}`, error);
      throw error;
    }
  }

  async deleteDocument(publishId: string): Promise<void> {
    try {
      await this.publishIndex.deleteDocument(publishId);
      this.logger.debug(`Deleted document: ${publishId}`);
    } catch (error) {
      this.logger.error(`Failed to delete document: ${publishId}`, error);
      throw error;
    }
  }

  async search(options: SearchOptions) {
    try {
      const filterStrings = this.buildFilters(options.filters);

      const searchParams: any = {
        q: options.query || '',
        limit: options.limit || 20,
        offset: options.offset || 0,
        filter: filterStrings.length > 0 ? filterStrings : undefined,
        sort: options.sort || ['createdAt:desc'],
      };

      const results = await this.publishIndex.search(searchParams.q, searchParams);

      return {
        hits: results.hits,
        estimatedTotalHits: results.estimatedTotalHits,
        limit: results.limit,
        offset: results.offset,
        processingTimeMs: results.processingTimeMs,
        query: results.query,
      };
    } catch (error) {
      this.logger.error('Search failed', error);
      throw error;
    }
  }

  async searchNearby(
    lat: number,
    lng: number,
    radius: number,
    query: string = '',
    additionalFilters?: SearchFilters,
  ) {
    return this.search({
      query,
      filters: {
        ...additionalFilters,
        geoRadius: { lat, lng, radius },
      },
    });
  }

  async searchInBoundingBox(
    topLeft: { lat: number; lng: number },
    bottomRight: { lat: number; lng: number },
    query: string = '',
    additionalFilters?: SearchFilters,
  ) {
    return this.search({
      query,
      filters: {
        ...additionalFilters,
        geoBoundingBox: { topLeft, bottomRight },
      },
    });
  }

  async searchByTopic(topicId: string, query: string = '', limit: number = 20) {
    return this.search({
      query,
      filters: { topicId },
      limit,
    });
  }

  async searchByUser(userId: string, query: string = '', limit: number = 20) {
    return this.search({
      query,
      filters: { userId },
      limit,
    });
  }

  async getStats() {
    try {
      return await this.publishIndex.getStats();
    } catch (error) {
      this.logger.error('Failed to get stats', error);
      throw error;
    }
  }

  async clearIndex(): Promise<void> {
    try {
      await this.publishIndex.deleteAllDocuments();
      this.logger.warn('All documents deleted from index');
    } catch (error) {
      this.logger.error('Failed to clear index', error);
      throw error;
    }
  }

  private transformToDocument(publish: any): PublishDocument {
    return {
      id: publish._id.toString(),
      userId: publish.userId?.toString() || publish.userId,
      topicId: publish.topicId?.toString() || publish.topicId,
      text: publish.text,
      _geo: {
        lat: publish.location?.coordinates?.[1] || 0,
        lng: publish.location?.coordinates?.[0] || 0,
      },
      createdAt: publish.createdAt ? new Date(publish.createdAt).getTime() : Date.now(),
    };
  }

  private buildFilters(filters?: SearchFilters): string[] {
    if (!filters) return [];

    const filterStrings: string[] = [];

    if (filters.userId) {
      filterStrings.push(`userId = "${filters.userId}"`);
    }

    if (filters.topicId) {
      filterStrings.push(`topicId = "${filters.topicId}"`);
    }

    if (filters.geoRadius) {
      const { lat, lng, radius } = filters.geoRadius;
      filterStrings.push(`_geoRadius(${lat}, ${lng}, ${radius})`);
    }

    if (filters.geoBoundingBox) {
      const { topLeft, bottomRight } = filters.geoBoundingBox;
      filterStrings.push(
        `_geoBoundingBox([${topLeft.lat}, ${topLeft.lng}], [${bottomRight.lat}, ${bottomRight.lng}])`,
      );
    }

    return filterStrings;
  }
}