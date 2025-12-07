import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

import { Lynk, LynkDocument, LynkStatus } from "./entities/lynk.entity";
import { LynkTex, LynkTexDocument } from "./entities/lynk-tex.entity";

import { CreateLynkPayload } from "./dto/create-lynk.payload";
import { ListLynksPayload } from "./dto/list-lynks.payload";
import { CreateLynkTexPayload } from "./dto/create-lynk-tex.payload";
import { ListLynkTexPayload } from "./dto/list-lynk-tex.payload";
import { SearchLynkTexesPayload } from "./dto/search-lynk-texes.payload";

import { ResponseService } from "../injection/response.service";
import { LynksMeiliSearchService } from "./meilisearch.service";

@Injectable()
export class LynksService implements OnModuleInit {
  private readonly logger = new Logger(LynksService.name);

  constructor(
    @InjectModel(Lynk.name) private readonly lynkModel: Model<LynkDocument>,
    @InjectModel(LynkTex.name) private readonly lynkTexModel: Model<LynkTexDocument>,
    private readonly responseService: ResponseService,
    private readonly meilisearchService: LynksMeiliSearchService,
  ) {}

  async onModuleInit() {
    await this.syncToMeiliSearch();
  }

  /**
   * Sync existing LynkTex documents into MeiliSearch on startup (optional).
   */
  private async syncToMeiliSearch(): Promise<void> {
    try {
      const count = await this.lynkTexModel.countDocuments();
      this.logger.log(`Starting LynkTex MeiliSearch sync for ${count} documents...`);

      const batchSize = 1000;
      let synced = 0;

      while (synced < count) {
        const docs = await this.lynkTexModel
          .find()
          .skip(synced)
          .limit(batchSize)
          .lean()
          .exec();

        if (!docs.length) break;

        await this.meilisearchService.indexDocuments(docs);
        synced += docs.length;

        this.logger.log(`Synced ${synced}/${count} LynkTex docs to MeiliSearch`);
      }

      this.logger.log("LynkTex MeiliSearch sync completed");
    } catch (error) {
      this.logger.error("Failed to sync LynkTex to MeiliSearch", error);
    }
  }

  /**
   * Create a Lynk between requester and target user (idempotent).
   */
  async createLynk(payload: CreateLynkPayload): Promise<void> {
    const channel = payload.token.userFields.channel;
    const requesterId = payload.token.userFields.id;

    try {
      const participants = [requesterId, payload.targetUserId].sort();

      let lynk = await this.lynkModel
        .findOne({
          participantIds: participants,
          isDeleted: false,
        })
        .exec();

      if (!lynk) {
        const unread = new Map<string, number>();
        unread.set(requesterId, 0);
        unread.set(payload.targetUserId, 0);

        lynk = new this.lynkModel({
          id: uuidv4(),
          participantIds: participants,
          status: LynkStatus.ACTIVE,
          worldTemplateId: payload.worldTemplateId || "default",
          xp: 0,
          level: 1,
          lastTexAt: null,
          unreadCountByUser: unread,
        });

        await lynk.save();
      }

      await this.responseService.sendSuccess(channel + "/createLynk", lynk);
    } catch (error) {
      this.logger.error("createLynk failed", error);
      await this.responseService.sendError(channel + "/createLynk", {
        message: "Failed to create lynk",
      });
    }
  }

  /**
   * List Lynks for current user, paged.
   */
  async listLynks(payload: ListLynksPayload): Promise<void> {
    const channel = payload.token.userFields.channel;
    const userId = payload.token.userFields.id;

    try {
      const page = payload.page ?? 1;
      const limit = payload.limit ?? 20;
      const skip = (page - 1) * limit;

      const query = {
        participantIds: userId,
        isDeleted: false,
      };

      const [lynks, total] = await Promise.all([
        this.lynkModel
          .find(query)
          .sort({ lastTexAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.lynkModel.countDocuments(query),
      ]);

      await this.responseService.sendSuccess(channel + "/listLynks", {
        lynks,
        total,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error("listLynks failed", error);
      await this.responseService.sendError(channel + "/listLynks", {
        message: "Failed to list lynks",
      });
    }
  }

  /**
   * Create a LynkTex (PV message) inside a Lynk, update XP/level, unread & Meili index.
   */
  async createLynkTex(payload: CreateLynkTexPayload): Promise<void> {
    const channel = payload.token.userFields.channel;
    const senderId = payload.token.userFields.id;

    try {
      const lynk = await this.lynkModel
        .findOne({ id: payload.lynkId, isDeleted: false })
        .exec();

      if (!lynk) {
        await this.responseService.sendError(channel + "/createLynkTex", {
          message: "Lynk not found",
        });
        return;
      }

      // make sure sender is part of this lynk
      if (!lynk.participantIds.includes(senderId)) {
        await this.responseService.sendError(channel + "/createLynkTex", {
          message: "Sender is not part of this lynk",
        });
        return;
      }

      const lynkTex = new this.lynkTexModel({
        id: uuidv4(),
        lynkId: lynk.id,
        senderId,
        text: payload.text,
        location: payload.location
          ? {
            type: "Point",
            coordinates: [payload.location[0], payload.location[1]],
          }
          : undefined,
        giftId: payload.giftId ?? null,
      });

      const saved = await lynkTex.save();

      // Update lynk metadata: lastTexAt, XP/level, unread counts
      const now = new Date();
      const xpGain = 1; // we can parameterize later

      lynk.lastTexAt = now;
      lynk.xp = (lynk.xp || 0) + xpGain;

      // simple level formula: level up every 20 XP
      lynk.level = 1 + Math.floor(lynk.xp / 20);

      const unread = new Map(lynk.unreadCountByUser || []);
      for (const pid of lynk.participantIds) {
        if (pid === senderId) continue;
        unread.set(pid, (unread.get(pid) || 0) + 1);
      }
      lynk.unreadCountByUser = unread;

      await lynk.save();

      // Index in MeiliSearch
      try {
        await this.meilisearchService.indexDocument(saved);
      } catch (error) {
        this.logger.error(
          `Failed to index LynkTex ${saved._id} in MeiliSearch`,
          error,
        );
      }

      await this.responseService.sendSuccess(channel + "/createLynkTex", {
        lynk,
        tex: saved,
      });
    } catch (error) {
      this.logger.error("createLynkTex failed", error);
      await this.responseService.sendError(channel + "/createLynkTex", {
        message: "Failed to create lynk tex",
      });
    }
  }

  /**
   * List LynkTex messages for a Lynk.
   */
  async listLynkTex(payload: ListLynkTexPayload): Promise<void> {
    const channel = payload.token.userFields.channel;
    const userId = payload.token.userFields.id;

    try {
      const lynk = await this.lynkModel
        .findOne({ id: payload.lynkId, isDeleted: false })
        .exec();

      if (!lynk || !lynk.participantIds.includes(userId)) {
        await this.responseService.sendError(channel + "/listLynkTex", {
          message: "Lynk not found or access denied",
        });
        return;
      }

      const page = payload.page ?? 1;
      const limit = payload.limit ?? 50;
      const skip = (page - 1) * limit;

      const query = { lynkId: lynk.id };

      const [items, total] = await Promise.all([
        this.lynkTexModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.lynkTexModel.countDocuments(query),
      ]);

      await this.responseService.sendSuccess(channel + "/listLynkTex", {
        texes: items,
        total,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error("listLynkTex failed", error);
      await this.responseService.sendError(channel + "/listLynkTex", {
        message: "Failed to list lynk texes",
      });
    }
  }

  /**
   * Search LynkTex using MeiliSearch (fast) with fallback to Mongo if needed.
   */
  async searchLynkTexes(payload: SearchLynkTexesPayload): Promise<void> {
    const channel = payload.token.userFields.channel;
    const userId = payload.token.userFields.id;

    try {
      const page = payload.page ?? 1;
      const limit = payload.limit ?? 50;
      const offset = (page - 1) * limit;

      const results = await this.meilisearchService.search({
        query: payload.query || "",
        filters: {
          lynkId: payload.lynkId,
          senderId: payload.senderId,
        },
        limit,
        offset,
      });

      this.logger.log(
        `LynkTex MeiliSearch found ${results.estimatedTotalHits} hits for "${payload.query}" in ${results.processingTimeMs}ms`,
      );

      await this.responseService.sendSuccess(channel + "/searchLynkTexes", {
        texes: results.hits,
        total: results.estimatedTotalHits,
        page,
        limit,
        processingTimeMs: results.processingTimeMs,
      });
    } catch (error) {
      this.logger.error("LynkTex search failed", error);
      await this.responseService.sendError(channel + "/searchLynkTexes", {
        message: "Failed to search lynk texes",
      });
    }
  }

  /**
   * Optional: reset unread counter when a user opens a Lynk.
   */
  async markLynkAsRead(lynkId: string, userId: string, channel: string): Promise<void> {
    try {
      const lynk = await this.lynkModel.findOne({ id: lynkId }).exec();
      if (!lynk) {
        await this.responseService.sendError(channel + "/markLynkAsRead", {
          message: "Lynk not found",
        });
        return;
      }

      const unread = new Map(lynk.unreadCountByUser || []);
      unread.set(userId, 0);
      lynk.unreadCountByUser = unread;
      await lynk.save();

      await this.responseService.sendSuccess(channel + "/markLynkAsRead", lynk);
    } catch (error) {
      this.logger.error("markLynkAsRead failed", error);
      await this.responseService.sendError(channel + "/markLynkAsRead", {
        message: "Failed to mark lynk as read",
      });
    }
  }
}
