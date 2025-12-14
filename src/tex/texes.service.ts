import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Tex, TexDocument } from "./entities/tex.entity";
import { CreateTexPayload } from "./dto/create-tex.payload";
import { UpdateTexPayload } from "./dto/update-tex.payload";
import { DeleteTexPayload } from "./dto/delete-tex.payload";
import { FetchTexPayload } from "./dto/fetch-tex.payload";
import { FindTexPayload } from "./dto/find-tex.payload";
import { SearchTexesPayload } from "./dto/search-texes.payload";

import { ResponseService } from "../injection/response.service";
import { RequestService } from "../injection/request.service";
import { MeiliSearchService } from "./meilisearch.service";

@Injectable()
export class TexesService implements OnModuleInit {
  private readonly logger = new Logger(TexesService.name);

  constructor(
    @InjectModel(Tex.name) private texModel: Model<TexDocument>,
    private readonly requestService: RequestService,
    private readonly responseService: ResponseService,
    private readonly meilisearchService: MeiliSearchService,
  ) {}

  async onModuleInit() {
    // Optionally sync existing data to MeiliSearch on startup
    await this.syncToMeiliSearch();
  }

  /**
   * Sync all existing MongoDB documents to MeiliSearch
   */
  private async syncToMeiliSearch(): Promise<void> {
    try {
      const count = await this.texModel.countDocuments();
      this.logger.log(`Starting MeiliSearch sync for ${count} documents...`);

      const batchSize = 1000;
      let synced = 0;

      while (synced < count) {
        const texes = await this.texModel
          .find()
          .skip(synced)
          .limit(batchSize)
          .lean()
          .exec();

        if (texes.length > 0) {
          await this.meilisearchService.indexDocuments(texes);
          synced += texes.length;
          this.logger.log(`Synced ${synced}/${count} documents to MeiliSearch`);
        } else {
          break;
        }
      }

      this.logger.log("MeiliSearch sync completed");
    } catch (error) {
      this.logger.error("Failed to sync to MeiliSearch", error);
    }
  }

  /**
   * Normalize location field from payload to GeoJSON { type, coordinates }
   */
  private normalizeLocation(
    raw: CreateTexPayload["location"] | UpdateTexPayload["location"],
  ): Tex["location"] | undefined {
    if (!raw) return undefined;

    // Already GeoJSON-ish
    if (typeof raw === "object" && "type" in raw && "coordinates" in raw) {
      return raw as any;
    }

    // Simple [lng, lat]
    if (Array.isArray(raw) && raw.length === 2) {
      return {
        type: "Point",
        coordinates: [raw[0], raw[1]],
      };
    }

    // Stringified JSON
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return this.normalizeLocation(parsed);
      } catch {
        this.logger.warn(`Failed to parse location string: ${raw}`);
        return undefined;
      }
    }

    return undefined;
  }


  /**
   * Create a new Tex (public globe or topic), with optional gift & gems.
   */
  async create(createTexPayload: CreateTexPayload): Promise<void> {
    const channel = createTexPayload.token.userFields.channel;

    try {
      // 1) Validate topic if provided
      if (createTexPayload.topic) {
        // const validateTopicRaw = await this.requestService.send("validateTopic", {
        //   token: createTexPayload.token,
        //   _id: createTexPayload.topic,
        // });
        //
        // const validateTopic = JSON.parse(validateTopicRaw);
        // if (!validateTopic.data?.success) {
        //   await this.responseService.sendError(channel + "/createTex", {
        //     message: "you are authorized to publish to this topic",
        //   });
        //   return;
        // }
      }

      // 2) Normalize userId from token
      createTexPayload.userId = createTexPayload.token.userFields.id;

      // 3) Default topic if none specified (public globe/custom)
      if (!createTexPayload.topic && createTexPayload.location) {
        createTexPayload.topic = "/globe";
      }


      // 5) Normalize location
      const location = this.normalizeLocation(createTexPayload.location);


      // 7) Create and save Tex
      const createdTex = new this.texModel({
        userId: createTexPayload.userId,
        topic: createTexPayload.topic,
        text: createTexPayload.text,
        location
      });

      const tex = await createdTex.save();

      // 8) Index to MeiliSearch
      try {
        await this.meilisearchService.indexDocument(tex);
        this.logger.debug(`Indexed tex ${tex._id} to MeiliSearch`);
      } catch (error) {
        this.logger.error(`Failed to index tex ${tex._id} to MeiliSearch`, error);
      }

      await this.responseService.sendSuccess(channel + "/createTex", tex);
    } catch (error) {
      this.logger.error("createTex failed", error);
      await this.responseService.sendError(channel + "/createTex", {
        message: "Failed to create tex",
      });
    }
  }


  /**
   * Search using MeiliSearch (fast, typo-tolerant, relevance-based)
   */
  async searchByQuery(searchTexesPayload: SearchTexesPayload): Promise<void> {
    const channel = searchTexesPayload.token.userFields.channel;

    try {
      const offset =
        searchTexesPayload.limit * (searchTexesPayload.page - 1);

      // Build filters for Meili
      const filters: any = {};
      if (searchTexesPayload.topic) {
        filters.topicId = searchTexesPayload.topic;
      }
      if (searchTexesPayload.userId) {
        filters.userId = searchTexesPayload.userId;
      }
      if (searchTexesPayload.giftId) {
        filters.giftId = searchTexesPayload.giftId;
      }

      const results = await this.meilisearchService.search({
        query: searchTexesPayload.query || "",
        limit: searchTexesPayload.limit,
        offset,
        filters: Object.keys(filters).length ? filters : undefined,
      });

      this.logger.log(
        `MeiliSearch found ${results.estimatedTotalHits} texes matching query "${searchTexesPayload.query}" in ${results.processingTimeMs}ms`,
      );

      await this.responseService.sendSuccess(channel + "/searchTexes", {
        texes: results.hits,
        total: results.estimatedTotalHits,
        processingTimeMs: results.processingTimeMs,
      });
    } catch (error) {
      this.logger.error(
        "MeiliSearch search failed, falling back to MongoDB",
        error,
      );
      // Fallback to MongoDB regex search
      await this.searchByQueryMongoDB(searchTexesPayload);
    }
  }

  /**
   * Fallback MongoDB search (kept for backwards compatibility)
   */
  private async searchByQueryMongoDB(
    searchTexesPayload: SearchTexesPayload,
  ): Promise<void> {
    const channel = searchTexesPayload.token.userFields.channel;
    const regex = new RegExp(searchTexesPayload.query, "i");
    const query: any = {
      $or: [{ text: regex }],
    };

    if (searchTexesPayload.topic) {
      query.topicId = searchTexesPayload.topic;
    }
    if (searchTexesPayload.userId) {
      query.userId = searchTexesPayload.userId;
    }
    if (searchTexesPayload.giftId) {
      query.giftId = searchTexesPayload.giftId;
    }

    const [texes, total] = await Promise.all([
      this.texModel
        .find(query)
        .limit(searchTexesPayload.limit)
        .skip(searchTexesPayload.limit * (searchTexesPayload.page - 1))
        .exec(),
      this.texModel.countDocuments(query),
    ]);

    this.logger.log(
      `MongoDB found ${total} texes matching query "${searchTexesPayload.query}"`,
    );

    await this.responseService.sendSuccess(channel + "/searchTexes", {
      texes,
      total,
    });
  }

  /**
   * Search by location (geo-spatial search using MeiliSearch)
   */
  async searchNearby(
    lat: number,
    lng: number,
    radius: number,
    query: string,
    topicId: string | undefined,
    limit: number,
    page: number,
    channel: string,
  ): Promise<void> {
    try {
      const results = await this.meilisearchService.searchNearby(
        lat,
        lng,
        radius,
        query,
        topicId ? { topic: topicId } : undefined,
      );

      await this.responseService.sendSuccess(channel + "/searchNearby", {
        texes: results.hits,
        total: results.estimatedTotalHits,
        processingTimeMs: results.processingTimeMs,
      });
    } catch (error) {
      this.logger.error("Geo search failed", error);
      await this.responseService.sendError(channel, {
        message: "Failed to perform geo search",
      });
    }
  }

  /**
   * Search by topic using MeiliSearch
   */
  async searchByTopic(
    topicId: string,
    query: string,
    limit: number,
    page: number,
    channel: string,
  ): Promise<void> {
    try {
      const results = await this.meilisearchService.searchByTopic(
        topicId,
        query,
        limit,
      );

      await this.responseService.sendSuccess(channel + "/searchByTopic", {
        texes: results.hits,
        total: results.estimatedTotalHits,
        processingTimeMs: results.processingTimeMs,
      });
    } catch (error) {
      this.logger.error("Topic search failed", error);
      await this.responseService.sendError(channel, {
        message: "Failed to search by topic",
      });
    }
  }

  /**
   * Search by user using MeiliSearch
   */
  async searchByUser(
    userId: string,
    query: string,
    limit: number,
    page: number,
    channel: string,
  ): Promise<void> {
    try {
      const results = await this.meilisearchService.searchByUser(
        userId,
        query,
        limit,
      );

      await this.responseService.sendSuccess(channel + "/searchByUser", {
        texes: results.hits,
        total: results.estimatedTotalHits,
        processingTimeMs: results.processingTimeMs,
      });
    } catch (error) {
      this.logger.error("User search failed", error);
      await this.responseService.sendError(channel, {
        message: "Failed to search by user",
      });
    }
  }

  async fetchAll(fetchTexesPayload: FetchTexPayload): Promise<void> {
    const channel = fetchTexesPayload.token.userFields.channel;

    const [texes, total] = await Promise.all([
      this.texModel
        .find()
        .limit(fetchTexesPayload.limit)
        .skip(fetchTexesPayload.limit * (fetchTexesPayload.page - 1))
        .exec(),
      this.texModel.countDocuments(),
    ]);

    await this.responseService.sendSuccess(channel + "/fetchTexes", {
      texes,
      total,
    });
  }

  async delete(deleteTexPayload: DeleteTexPayload): Promise<void> {
    const channel = deleteTexPayload.token.userFields.channel;

    const deleted = await this.texModel
      .deleteOne({ _id: deleteTexPayload._id })
      .exec();

    // Delete from MeiliSearch if document existed
    if (deleted.deletedCount > 0) {
      try {
        await this.meilisearchService.deleteDocument(deleteTexPayload._id);
        this.logger.debug(
          `Deleted tex ${deleteTexPayload._id} from MeiliSearch`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to delete tex ${deleteTexPayload._id} from MeiliSearch`,
          error,
        );
      }
    }

    await this.responseService.sendSuccess(channel + "/deleteTex", deleted);
  }

  async findById(findTexPayload: FindTexPayload): Promise<void> {
    const channel = findTexPayload.token.userFields.channel;
    const tex = await this.texModel.findById(findTexPayload._id).exec();

    await this.responseService.sendSuccess(channel + "/findTex", tex);
  }

  /**
   * Find texes by person with filters:
   * - personId (required)
   * - fromDate / toDate
   * - isPublic
   * - limit
   */
  async getTexes(payload: {
    token: any;
    personId: string;
    fromDate?: Date;
    toDate?: Date;
    isPublic?: boolean;
    limit?: number;
  }): Promise<void> {
    const channel = payload.token.userFields.channel;
    const query: any = { userId: payload.personId };

    // Date range filter
    if (payload.fromDate || payload.toDate) {
      query.createdAt = {};
      if (payload.fromDate) query.createdAt.$gte = payload.fromDate;
      if (payload.toDate) query.createdAt.$lte = payload.toDate;
    }

    // Public filter
    if (payload.isPublic !== undefined) {
      query.isPublic = payload.isPublic;
    }

    const limit = payload.limit ?? 50;

    const texes = await this.texModel
      .find(query)
      .sort({ createdAt: -1 }) // latest first
      .limit(limit)
      .lean()
      .exec();

    await this.responseService.sendSuccess(channel + "/getTexes", texes);
  }

  /**
   * Bulk reindex all documents to MeiliSearch
   */
  async reindexAll(channel: string): Promise<void> {
    try {
      await this.meilisearchService.clearIndex();
      await this.syncToMeiliSearch();

      await this.responseService.sendSuccess(channel + "/reindexAll", {
        message: "All documents reindexed successfully",
      });
    } catch (error) {
      this.logger.error("Reindex failed", error);
      await this.responseService.sendError(channel + "/reindexAll", {
        message: "Failed to reindex documents",
      });
    }
  }

  /**
   * Get MeiliSearch index statistics
   */
  async getSearchStats(channel: string): Promise<void> {
    try {
      const stats = await this.meilisearchService.getStats();
      await this.responseService.sendSuccess(
        channel + "/getSearchStats",
        stats,
      );
    } catch (error) {
      this.logger.error("Failed to get search stats", error);
      await this.responseService.sendError(channel + "/getSearchStats", {
        message: "Failed to get search statistics",
      });
    }
  }
}
