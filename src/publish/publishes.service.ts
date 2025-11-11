import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreatePublishPayload } from "./dto/create-publish.payload";
import { Publish } from "./entities/publish.entity";
import { UpdatePublishPayload } from "./dto/update-publish.payload";
import { ResponseService } from "../injection/response.service";
import { DeletePublishPayload } from "./dto/delete-publish.payload";
import { FetchPublishPayload } from "./dto/fetch-publish.payload";
import { FindPublishPayload } from "./dto/find-publish.payload";
import { SearchPublishesPayload } from "./dto/search-publishes.payload";
import { RequestService } from "../injection/request.service";
import { MeiliSearchService } from "./meilisearch.service";

@Injectable()
export class PublishesService implements OnModuleInit {
  private readonly logger = new Logger(PublishesService.name);

  constructor(
    @InjectModel(Publish.name) private publishModel: Model<Publish>,
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
      const count = await this.publishModel.countDocuments();
      this.logger.log(`Starting MeiliSearch sync for ${count} documents...`);

      const batchSize = 1000;
      let synced = 0;

      while (synced < count) {
        const publishes = await this.publishModel
          .find()
          .skip(synced)
          .limit(batchSize)
          .lean()
          .exec();

        if (publishes.length > 0) {
          await this.meilisearchService.indexDocuments(publishes);
          synced += publishes.length;
          this.logger.log(`Synced ${synced}/${count} documents to MeiliSearch`);
        }
      }

      this.logger.log("MeiliSearch sync completed");
    } catch (error) {
      this.logger.error("Failed to sync to MeiliSearch", error);
    }
  }

  async create(createPublishPayload: CreatePublishPayload): Promise<void> {
    const findTopic = JSON.parse(
      await this.requestService.send("findTopic", {
        token: createPublishPayload.token,
        _id: createPublishPayload.topicId,
      })
    );

    if (!findTopic.data.success) {
      // Handle topic not found
      return;
    }

    createPublishPayload.userId = createPublishPayload.token.userFields.id;
    const createdPublish = new this.publishModel(createPublishPayload);
    const publish = await createdPublish.save();

    // Index to MeiliSearch
    try {
      await this.meilisearchService.indexDocument(publish);
      this.logger.debug(`Indexed publish ${publish._id} to MeiliSearch`);
    } catch (error) {
      this.logger.error(`Failed to index publish ${publish._id} to MeiliSearch`, error);
    }

    await this.responseService.sendSuccess(
      createPublishPayload.token.userFields.channel + "/createPublish",
      publish
    );
  }

  async update(updatePublishPayload: UpdatePublishPayload): Promise<void> {
    const existingPublish = await this.publishModel
      .findById(updatePublishPayload._id)
      .exec();

    if (!existingPublish) {
      await this.responseService.sendError(
        updatePublishPayload.token.userFields.channel,
        {
          "publish._id": "publish _id does not exists",
        }
      );
      return;
    }

    existingPublish.set(updatePublishPayload);
    const updatedOption = await existingPublish.save();

    // Update in MeiliSearch
    try {
      await this.meilisearchService.updateDocument(updatedOption);
      this.logger.debug(`Updated publish ${updatedOption._id} in MeiliSearch`);
    } catch (error) {
      this.logger.error(`Failed to update publish ${updatedOption._id} in MeiliSearch`, error);
    }

    await this.responseService.sendSuccess(
      updatePublishPayload.token.userFields.channel + "/updatePublish",
      updatedOption
    );
  }

  /**
   * Search using MeiliSearch (fast, typo-tolerant, relevance-based)
   */
  async searchByQuery(searchPublishesPayload: SearchPublishesPayload): Promise<void> {
    try {
      // Use MeiliSearch for fast search
      const results = await this.meilisearchService.search({
        query: searchPublishesPayload.query || "",
        limit: searchPublishesPayload.limit,
        offset: searchPublishesPayload.limit * (searchPublishesPayload.page - 1),
        filters: searchPublishesPayload.topicId
          ? { topicId: searchPublishesPayload.topicId }
          : undefined,
      });

      this.logger.log(
        `MeiliSearch found ${results.estimatedTotalHits} publishes matching query "${searchPublishesPayload.query}" in ${results.processingTimeMs}ms`
      );

      await this.responseService.sendSuccess(
        searchPublishesPayload.token.userFields.channel + "/searchPublishes",
        {
          publishes: results.hits,
          total: results.estimatedTotalHits,
          processingTimeMs: results.processingTimeMs,
        }
      );
    } catch (error) {
      this.logger.error("MeiliSearch search failed, falling back to MongoDB", error);
      // Fallback to MongoDB regex search
      await this.searchByQueryMongoDB(searchPublishesPayload);
    }
  }

  /**
   * Fallback MongoDB search (kept for backwards compatibility)
   */
  private async searchByQueryMongoDB(searchPublishesPayload: SearchPublishesPayload): Promise<void> {
    const regex = new RegExp(searchPublishesPayload.query, "i");
    const query: any = {
      $or: [{ text: regex }],
    };

    if (searchPublishesPayload.topicId) {
      query.topicId = searchPublishesPayload.topicId;
    }

    const [publishes, total] = await Promise.all([
      this.publishModel
        .find(query)
        .limit(searchPublishesPayload.limit)
        .skip(searchPublishesPayload.limit * (searchPublishesPayload.page - 1))
        .exec(),
      this.publishModel.countDocuments(query),
    ]);

    this.logger.log(`MongoDB found ${total} publishes matching query "${searchPublishesPayload.query}"`);

    await this.responseService.sendSuccess(
      searchPublishesPayload.token.userFields.channel + "/searchPublishes",
      {
        publishes: publishes,
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
        publishes: results.hits,
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
        publishes: results.hits,
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
        publishes: results.hits,
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

  async fetchAll(fetchPublishesPayload: FetchPublishPayload): Promise<void> {
    const [publishes, total] = await Promise.all([
      this.publishModel
        .find()
        .limit(fetchPublishesPayload.limit)
        .skip(fetchPublishesPayload.limit * (fetchPublishesPayload.page - 1))
        .exec(),
      this.publishModel.countDocuments(),
    ]);

    await this.responseService.sendSuccess(
      fetchPublishesPayload.token.userFields.channel + "/fetchPublishes",
      {
        publishes: publishes,
        total,
      }
    );
  }

  async delete(deletePublishPayload: DeletePublishPayload): Promise<void> {
    const deleted = await this.publishModel
      .deleteOne({ _id: deletePublishPayload._id })
      .exec();

    // Delete from MeiliSearch
    if (deleted.deletedCount > 0) {
      try {
        await this.meilisearchService.deleteDocument(deletePublishPayload._id);
        this.logger.debug(`Deleted publish ${deletePublishPayload._id} from MeiliSearch`);
      } catch (error) {
        this.logger.error(`Failed to delete publish ${deletePublishPayload._id} from MeiliSearch`, error);
      }
    }

    await this.responseService.sendSuccess(
      deletePublishPayload.token.userFields.channel + "/deletePublish",
      deleted
    );
  }

  async findById(findPublishPayload: FindPublishPayload): Promise<void> {
    const publish = await this.publishModel.findById(findPublishPayload._id).exec();
    await this.responseService.sendSuccess(
      findPublishPayload.token.userFields.channel + "/findPublish",
      publish
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