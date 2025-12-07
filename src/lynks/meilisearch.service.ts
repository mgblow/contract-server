import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Index, MeiliSearch } from "meilisearch";

export interface LynkTexDocument {
  id: string;
  lynkId: string;
  senderId: string;
  text: string;
  _geo: { lat: number; lng: number };
  createdAt?: number;
}

export interface LynkTexSearchFilters {
  lynkId?: string;
  senderId?: string;
  geoRadius?: { lat: number; lng: number; radius: number };
}

export interface LynkTexSearchOptions {
  query: string;
  filters?: LynkTexSearchFilters;
  limit?: number;
  offset?: number;
  sort?: string[];
}

@Injectable()
export class LynksMeiliSearchService implements OnModuleInit {
  private readonly logger = new Logger(LynksMeiliSearchService.name);

  private client: MeiliSearch;
  private index: Index;
  private readonly indexName = "lynktexes";

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILI_HOST || "http://127.0.0.1:7700",
      apiKey: process.env.MEILI_API_KEY || "",
    });
  }

  async onModuleInit() {
    await this.initializeIndex();
  }

  private async initializeIndex() {
    try {
      const indexes = await this.client.getIndexes();
      const existing = indexes.results.find((i) => i.uid === this.indexName);

      if (!existing) {
        await this.client.createIndex(this.indexName, { primaryKey: "id" });
        this.logger.log(`Created index "${this.indexName}" with primary key 'id'`);
      } else if (!existing.primaryKey) {
        await this.client.index(this.indexName).update({ primaryKey: "id" });
        this.logger.log(`Updated index "${this.indexName}" to use primary key 'id'`);
      }

      this.index = this.client.index(this.indexName);

      await this.index.updateSettings({
        searchableAttributes: ["text", "lynkId", "senderId"],
        filterableAttributes: ["lynkId", "senderId", "_geo", "createdAt"],
        sortableAttributes: ["createdAt"],
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
        ],
        displayedAttributes: [
          "id",
          "lynkId",
          "senderId",
          "text",
          "_geo",
          "createdAt",
        ],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 },
        },
        pagination: { maxTotalHits: 10000 },
      });

      this.logger.log(`MeiliSearch index "${this.indexName}" initialized`);
    } catch (error) {
      this.logger.error("Failed to initialize MeiliSearch index", error);
      throw error;
    }
  }

  async indexDocument(lynkTex: any): Promise<void> {
    try {
      const document = this.transformToDocument(lynkTex);
      const result = await this.index.addDocuments([document]);
      this.logger.debug(`Indexed LynkTex ${document.id} – task: ${result.taskUid}`);
    } catch (error) {
      this.logger.error(`Failed to index LynkTex ${lynkTex._id}`, error);
      throw error;
    }
  }

  async indexDocuments(lynkTexes: any[]): Promise<void> {
    try {
      const documents = lynkTexes.map((t) => this.transformToDocument(t));
      const result = await this.index.addDocuments(documents);
      this.logger.log(
        `Indexed ${documents.length} LynkTex documents. Task: ${result.taskUid}`,
      );
    } catch (error) {
      this.logger.error("Failed to index LynkTex documents", error);
      throw error;
    }
  }

  async updateDocument(lynkTex: any): Promise<void> {
    try {
      const document = this.transformToDocument(lynkTex);
      await this.index.updateDocuments([document]);
      this.logger.debug(`Updated LynkTex document: ${document.id}`);
    } catch (error) {
      this.logger.error(`Failed to update LynkTex ${lynkTex._id}`, error);
      throw error;
    }
  }

  async deleteDocument(lynkTexId: string): Promise<void> {
    try {
      await this.index.deleteDocument(lynkTexId);
      this.logger.debug(`Deleted LynkTex document: ${lynkTexId}`);
    } catch (error) {
      this.logger.error(`Failed to delete LynkTex document: ${lynkTexId}`, error);
      throw error;
    }
  }

  async search(options: LynkTexSearchOptions) {
    try {
      const filterStrings = this.buildFilters(options.filters);
      const searchParams: any = {
        q: options.query || "",
        limit: options.limit || 20,
        offset: options.offset || 0,
        filter: filterStrings.length > 0 ? filterStrings : undefined,
        sort: options.sort || ["createdAt:desc"],
      };

      const results = await this.index.search(searchParams.q, searchParams);

      return {
        hits: results.hits,
        estimatedTotalHits: results.estimatedTotalHits,
        limit: results.limit,
        offset: results.offset,
        processingTimeMs: results.processingTimeMs,
        query: results.query,
      };
    } catch (error) {
      this.logger.error("LynkTex search failed", error);
      throw error;
    }
  }

  async searchByLynk(
    lynkId: string,
    query: string = "",
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.search({
      query,
      filters: { lynkId },
      limit,
      offset,
    });
  }

  async searchByUser(
    senderId: string,
    query: string = "",
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.search({
      query,
      filters: { senderId },
      limit,
      offset,
    });
  }

  async searchNearby(
    lat: number,
    lng: number,
    radius: number,
    query: string = "",
    additionalFilters?: LynkTexSearchFilters,
  ) {
    return this.search({
      query,
      filters: {
        ...additionalFilters,
        geoRadius: { lat, lng, radius },
      },
    });
  }

  async clearIndex(): Promise<void> {
    try {
      await this.index.deleteAllDocuments();
      this.logger.warn("All LynkTex documents deleted from index");
    } catch (error) {
      this.logger.error("Failed to clear LynkTex index", error);
      throw error;
    }
  }

  async getStats() {
    try {
      return await this.index.getStats();
    } catch (error) {
      this.logger.error("Failed to get LynkTex index stats", error);
      throw error;
    }
  }

  private transformToDocument(lynkTex: any): LynkTexDocument {
    return {
      id: lynkTex._id.toString(),
      lynkId: lynkTex.lynkId?.toString() || lynkTex.lynkId,
      senderId: lynkTex.senderId?.toString() || lynkTex.senderId,
      text: lynkTex.text,
      _geo: {
        lat: lynkTex.location?.coordinates?.[1] || 0,
        lng: lynkTex.location?.coordinates?.[0] || 0,
      },
      createdAt: lynkTex.createdAt
        ? new Date(lynkTex.createdAt).getTime()
        : Date.now(),
    };
  }

  private buildFilters(filters?: LynkTexSearchFilters): string[] {
    if (!filters) return [];
    const filterStrings: string[] = [];

    if (filters.lynkId) {
      filterStrings.push(`lynkId = "${filters.lynkId}"`);
    }
    if (filters.senderId) {
      filterStrings.push(`senderId = "${filters.senderId}"`);
    }
    if (filters.geoRadius) {
      const { lat, lng, radius } = filters.geoRadius;
      filterStrings.push(`_geoRadius(${lat}, ${lng}, ${radius})`);
    }

    return filterStrings;
  }
}
