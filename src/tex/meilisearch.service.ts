import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { MeiliSearch, Index } from "meilisearch";

export interface TexSearchDocument {
  id: string;          // Meili primary key
  userId: string;
  topic: string;
  text: string;

  _geo: {              // for geo search
    lat: number;
    lng: number;
  };

  gemId?: string | null;
  createdAt?: number;  // timestamp (ms)
}

export interface TexSearchFilters {
  userId?: string;
  topic?: string;
  gemId?: string;
  geoRadius?: { lat: number; lng: number; radius: number };
}

export interface TexSearchOptions {
  query: string;
  filters?: TexSearchFilters;
  limit?: number;
  offset?: number;
  sort?: string[];
}

@Injectable()
export class MeiliSearchService implements OnModuleInit {
  private readonly logger = new Logger(MeiliSearchService.name);

  private client: MeiliSearch;
  private index: Index;
  private readonly indexName = "texes";

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
      // Create / ensure index
      const indexes = await this.client.getIndexes();
      const existing = indexes.results.find((i) => i.uid === this.indexName);

      if (!existing) {
        await this.client.createIndex(this.indexName, { primaryKey: "id" });
        this.logger.log(
          `Created Meili index "${this.indexName}" with primary key "id"`,
        );
      } else if (!existing.primaryKey) {
        await this.client.index(this.indexName).update({ primaryKey: "id" });
        this.logger.log(
          `Updated Meili index "${this.indexName}" to use primary key "id"`,
        );
      }

      this.index = this.client.index(this.indexName);

      // Configure settings (searchable, filterable, sortable, ranking)
      await this.index.updateSettings({
        searchableAttributes: ["text", "topicId", "userId", "giftId"],
        filterableAttributes: [
          "topicId",
          "userId",
          "giftId",
          "isPublic",
          "_geo",
          "createdAt",
        ],
        sortableAttributes: ["createdAt", "gemValue"],
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
          "userId",
          "topicId",
          "text",
          "giftId",
          "gemValue",
          "isPublic",
          "_geo",
          "createdAt",
        ],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 },
        },
        pagination: { maxTotalHits: 10000 },
      });

      this.logger.log(`Meili index "${this.indexName}" initialized`);
    } catch (error) {
      this.logger.error("Failed to initialize Meili index", error);
      throw error;
    }
  }

  /** Transform Mongo Tex document to Meili document */
  private transformToDocument(tex: any): TexSearchDocument {
    return {
      id: tex._id?.toString() ?? tex.id?.toString(),
      userId: tex.userId?.toString() ?? "",
      topic: tex.topic?.toString() ?? "",
      text: tex.text ?? "",
      _geo: {
        lat: tex.location?.coordinates?.[1] ?? 0,
        lng: tex.location?.coordinates?.[0] ?? 0,
      },
      gemId: tex.gemId ?? null,
      createdAt: tex.createdAt
        ? new Date(tex.createdAt).getTime()
        : Date.now(),
    };
  }

  private buildFilters(filters?: TexSearchFilters): string[] {
    if (!filters) return [];

    const filterStrings: string[] = [];

    if (filters.topic) {
      filterStrings.push(`topicId = "${filters.topic}"`);
    }
    if (filters.userId) {
      filterStrings.push(`userId = "${filters.userId}"`);
    }
    if (filters.gemId) {
      filterStrings.push(`giftId = "${filters.gemId}"`);
    }
    if (filters.geoRadius) {
      const { lat, lng, radius } = filters.geoRadius;
      filterStrings.push(`_geoRadius(${lat}, ${lng}, ${radius})`);
    }

    return filterStrings;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD on index
  // ─────────────────────────────────────────────────────────────────────────────

  async indexDocument(tex: any): Promise<void> {
    try {
      const doc = this.transformToDocument(tex);
      const res = await this.index.addDocuments([doc]);
      this.logger.debug(
        `Indexed tex ${doc.id} in Meili (taskUid=${res.taskUid})`,
      );
    } catch (error) {
      this.logger.error(`Failed to index tex ${tex._id}`, error);
      throw error;
    }
  }

  async indexDocuments(texes: any[]): Promise<void> {
    if (!texes.length) return;

    try {
      const docs = texes.map((t) => this.transformToDocument(t));
      const res = await this.index.addDocuments(docs);
      this.logger.log(
        `Indexed ${docs.length} texes in Meili (taskUid=${res.taskUid})`,
      );
    } catch (error) {
      this.logger.error("Failed to index tex documents", error);
      throw error;
    }
  }

  async updateDocument(tex: any): Promise<void> {
    try {
      const doc = this.transformToDocument(tex);
      await this.index.updateDocuments([doc]);
      this.logger.debug(`Updated tex ${doc.id} in Meili`);
    } catch (error) {
      this.logger.error(`Failed to update tex ${tex._id}`, error);
      throw error;
    }
  }

  async deleteDocument(texId: string): Promise<void> {
    try {
      await this.index.deleteDocument(texId);
      this.logger.debug(`Deleted tex ${texId} from Meili`);
    } catch (error) {
      this.logger.error(`Failed to delete tex ${texId}`, error);
      throw error;
    }
  }

  async clearIndex(): Promise<void> {
    try {
      await this.index.deleteAllDocuments();
      this.logger.warn("All tex documents deleted from Meili index");
    } catch (error) {
      this.logger.error("Failed to clear tex index", error);
      throw error;
    }
  }

  async getStats() {
    try {
      return await this.index.getStats();
    } catch (error) {
      this.logger.error("Failed to get Meili index stats", error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Search APIs
  // ─────────────────────────────────────────────────────────────────────────────

  async search(options: TexSearchOptions) {
    try {
      const filterStrings = this.buildFilters(options.filters);
      const params: any = {
        q: options.query || "",
        limit: options.limit ?? 20,
        offset: options.offset ?? 0,
        sort: options.sort ?? ["createdAt:desc"],
      };

      if (filterStrings.length > 0) {
        params.filter = filterStrings;
      }

      const res = await this.index.search(params.q, params);

      return {
        hits: res.hits,
        estimatedTotalHits: res.estimatedTotalHits,
        limit: res.limit,
        offset: res.offset,
        processingTimeMs: res.processingTimeMs,
        query: res.query,
      };
    } catch (error) {
      this.logger.error("Tex search in Meili failed", error);
      throw error;
    }
  }

  async searchByTopic(
    topicId: string,
    query: string = "",
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.search({
      query,
      filters: { topic: topicId },
      limit,
      offset,
    });
  }

  async searchByUser(
    userId: string,
    query: string = "",
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.search({
      query,
      filters: { userId },
      limit,
      offset,
    });
  }

  async searchByGift(
    giftId: string,
    query: string = "",
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.search({
      query,
      filters: { gemId: giftId },
      limit,
      offset,
    });
  }

  async searchNearby(
    lat: number,
    lng: number,
    radius: number,
    query: string = "",
    additionalFilters?: Omit<TexSearchFilters, "geoRadius">,
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.search({
      query,
      filters: {
        ...(additionalFilters || {}),
        geoRadius: { lat, lng, radius },
      },
      limit,
      offset,
    });
  }
}
