import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateTexPayload } from "./dto/create-tex.payload";
import { Tex } from "./entities/tex.entity";
import { UpdateTexPayload } from "./dto/update-tex.payload";
import { ResponseService } from "../injection/response.service";
import { DeleteTexPayload } from "./dto/delete-tex.payload";
import { FetchTexPayload } from "./dto/fetch-tex.payload";
import { FindTexPayload } from "./dto/find-tex.payload";
import { SearchTexesPayload } from "./dto/search-texes.payload";
import { RequestService } from "../injection/request.service";
import { MeiliSearchService } from "./meilisearch.service";

@Injectable()
export class TexesService implements OnModuleInit {
  private readonly logger = new Logger(TexesService.name);

  constructor(
    @InjectModel(Tex.name) private texModel: Model<Tex>,
    private readonly requestService: RequestService,
    private readonly responseService: ResponseService,
    private readonly meilisearchService: MeiliSearchService
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
        }
      }

      this.logger.log("MeiliSearch sync completed");
    } catch (error) {
      this.logger.error("Failed to sync to MeiliSearch", error);
    }
  }

  async create(createTexPayload: CreateTexPayload): Promise<void> {
    const findTopic = JSON.parse(
      await this.requestService.send("findTopic", {
        token: createTexPayload.token,
        _id: createTexPayload.topicId,
      })
    );

    if (!findTopic.data.success) {
      // Handle topic not found
    }

    createTexPayload.userId = createTexPayload.token.userFields.id;

    if(createTexPayload.topicId == undefined && createTexPayload.location != undefined) {
      createTexPayload.topicId = "/public/globe";
    } else if(createTexPayload.topicId == null) {
      createTexPayload.topicId = "/public";
    }
    const createdTex = new this.texModel(createTexPayload);
    const tex = await createdTex.save();

    // Index to MeiliSearch
    try {
      await this.meilisearchService.indexDocument(tex);
      this.logger.debug(`Indexed tex ${tex._id} to MeiliSearch`);
    } catch (error) {
      this.logger.error(`Failed to index tex ${tex._id} to MeiliSearch`, error);
    }

    await this.responseService.sendSuccess(
      createTexPayload.token.userFields.channel + "/createTex",
      tex
    );
  }

  async update(updateTexPayload: UpdateTexPayload): Promise<void> {
    const existingTex = await this.texModel
      .findById(updateTexPayload._id)
      .exec();

    if (!existingTex) {
      await this.responseService.sendError(
        updateTexPayload.token.userFields.channel,
        {
          "tex._id": "tex _id does not exists",
        }
      );
      return;
    }

    existingTex.set(updateTexPayload);
    const updatedOption = await existingTex.save();

    // Update in MeiliSearch
    try {
      await this.meilisearchService.updateDocument(updatedOption);
      this.logger.debug(`Updated tex ${updatedOption._id} in MeiliSearch`);
    } catch (error) {
      this.logger.error(`Failed to update tex ${updatedOption._id} in MeiliSearch`, error);
    }

    await this.responseService.sendSuccess(
      updateTexPayload.token.userFields.channel + "/updateTex",
      updatedOption
    );
  }

  /**
   * Search using MeiliSearch (fast, typo-tolerant, relevance-based)
   */
  async searchByQuery(searchTexesPayload: SearchTexesPayload): Promise<void> {
    try {
      // Use MeiliSearch for fast search
      const results = await this.meilisearchService.search({
        query: searchTexesPayload.query || "",
        limit: searchTexesPayload.limit,
        offset: searchTexesPayload.limit * (searchTexesPayload.page - 1),
        filters: searchTexesPayload.topicId
          ? { topicId: searchTexesPayload.topicId }
          : undefined,
      });

      this.logger.log(
        `MeiliSearch found ${results.estimatedTotalHits} texes matching query "${searchTexesPayload.query}" in ${results.processingTimeMs}ms`
      );

      await this.responseService.sendSuccess(
        searchTexesPayload.token.userFields.channel + "/searchTexes",
        {
          texes: results.hits,
          total: results.estimatedTotalHits,
          processingTimeMs: results.processingTimeMs,
        }
      );
    } catch (error) {
      this.logger.error("MeiliSearch search failed, falling back to MongoDB", error);
      // Fallback to MongoDB regex search
      await this.searchByQueryMongoDB(searchTexesPayload);
    }
  }

  /**
   * Fallback MongoDB search (kept for backwards compatibility)
   */
  private async searchByQueryMongoDB(searchTexesPayload: SearchTexesPayload): Promise<void> {
    const regex = new RegExp(searchTexesPayload.query, "i");
    const query: any = {
      $or: [{ text: regex }],
    };

    if (searchTexesPayload.topicId) {
      query.topicId = searchTexesPayload.topicId;
    }

    const [texes, total] = await Promise.all([
      this.texModel
        .find(query)
        .limit(searchTexesPayload.limit)
        .skip(searchTexesPayload.limit * (searchTexesPayload.page - 1))
        .exec(),
      this.texModel.countDocuments(query),
    ]);

    this.logger.log(`MongoDB found ${total} texes matching query "${searchTexesPayload.query}"`);

    await this.responseService.sendSuccess(
      searchTexesPayload.token.userFields.channel + "/searchTexes",
      {
        texes: texes,
        total: total,
      }
    );
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
    channel: string
  ): Promise<void> {
    try {
      const results = await this.meilisearchService.searchNearby(
        lat,
        lng,
        radius,
        query,
        topicId ? { topicId } : undefined
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
    channel: string
  ): Promise<void> {
    try {
      const results = await this.meilisearchService.searchByTopic(
        topicId,
        query,
        limit
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
    channel: string
  ): Promise<void> {
    try {
      const results = await this.meilisearchService.searchByUser(
        userId,
        query,
        limit
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
    const [texes, total] = await Promise.all([
      this.texModel
        .find()
        .limit(fetchTexesPayload.limit)
        .skip(fetchTexesPayload.limit * (fetchTexesPayload.page - 1))
        .exec(),
      this.texModel.countDocuments(),
    ]);

    await this.responseService.sendSuccess(
      fetchTexesPayload.token.userFields.channel + "/fetchTexes",
      {
        texes: texes,
        total,
      }
    );
  }

  async delete(deleteTexPayload: DeleteTexPayload): Promise<void> {
    const deleted = await this.texModel
      .deleteOne({ _id: deleteTexPayload._id })
      .exec();

    // Delete from MeiliSearch
    if (deleted.deletedCount > 0) {
      try {
        await this.meilisearchService.deleteDocument(deleteTexPayload._id);
        this.logger.debug(`Deleted tex ${deleteTexPayload._id} from MeiliSearch`);
      } catch (error) {
        this.logger.error(`Failed to delete tex ${deleteTexPayload._id} from MeiliSearch`, error);
      }
    }

    await this.responseService.sendSuccess(
      deleteTexPayload.token.userFields.channel + "/deleteTex",
      deleted
    );
  }

  async findById(findTexPayload: FindTexPayload): Promise<void> {
    const tex = await this.texModel.findById(findTexPayload._id).exec();
    await this.responseService.sendSuccess(
      findTexPayload.token.userFields.channel + "/findTex",
      tex
    );
  }

  /**
   * Find texes by person with filters:
   * - personId (required)
   * - fromDate / toDate
   * - isPublic
   * - limit
   */
  async getTexes(payload: any) {
    const query: any = {
      userId: payload.personId
    };

    // Date range filter
    if (payload.fromDate || payload.toDate) {
      query.createdAt = {};
      if (payload.fromDate) query.createdAt.$gte = payload.fromDate;
      if (payload.toDate)   query.createdAt.$lte = payload.toDate;
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

    await this.responseService.sendSuccess(
      payload.token.userFields.channel + "/getTexes",
      texes
    );
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
      await this.responseService.sendError(channel, {
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
      await this.responseService.sendSuccess(channel + "/getSearchStats", stats);
    } catch (error) {
      this.logger.error("Failed to get search stats", error);
      await this.responseService.sendError(channel, {
        message: "Failed to get search statistics",
      });
    }
  }
}