import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

import {
  GemDefinition,
  GemDefinitionDocument,
} from "./entities/gem-definition.entity";
import { GemSpawn, GemSpawnDocument } from "./entities/gem-spawn.entity";
import { GemPickup, GemPickupDocument } from "./entities/gem-pickup.entity";
import { GemWallet, GemWalletDocument } from "./entities/gem-wallet.entity";

import { GetBalancePayload } from "./dto/get-balance.payload";
import { EarnGemsPayload } from "./dto/earn-gems.payload";
import { SpendGemsPayload } from "./dto/spend-gems.payload";
import { CreateGemSpawnPayload } from "./dto/create-gem-spawn.payload";
import { SearchNearbyGemsPayload } from "./dto/search-nearby-gems.payload";
import { PickupGemPayload } from "./dto/pickup-gem.payload";

import { ResponseService } from "../injection/response.service";

@Injectable()
export class GemsService {
  private readonly logger = new Logger(GemsService.name);

  constructor(
    @InjectModel(GemDefinition.name)
    private readonly defModel: Model<GemDefinitionDocument>,
    @InjectModel(GemSpawn.name)
    private readonly spawnModel: Model<GemSpawnDocument>,
    @InjectModel(GemPickup.name)
    private readonly pickupModel: Model<GemPickupDocument>,
    @InjectModel(GemWallet.name)
    private readonly walletModel: Model<GemWalletDocument>,
    private readonly responseService: ResponseService,
  ) {}

  // ───────────────────────────── Helpers ─────────────────────────────

  private normalizeLocation(
    raw:
      | { type: "Point"; coordinates: [number, number] }
      | [number, number]
      | string
      | undefined,
  ):
    | {
    type: "Point";
    coordinates: [number, number];
  }
    | undefined {
    if (!raw) return undefined;

    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return this.normalizeLocation(parsed);
      } catch {
        this.logger.warn(`Failed to parse location string: ${raw}`);
        return undefined;
      }
    }

    if (Array.isArray(raw) && raw.length === 2) {
      return {
        type: "Point",
        coordinates: [raw[0], raw[1]],
      };
    }

    if (
      typeof raw === "object" &&
      "type" in raw &&
      "coordinates" in raw
    ) {
      return raw as any;
    }

    return undefined;
  }

  private async getOrCreateWallet(userId: string): Promise<GemWalletDocument> {
    let wallet = await this.walletModel.findOne({ userId }).exec();
    if (!wallet) {
      wallet = new this.walletModel({ userId, balance: 0 });
      await wallet.save();
    }
    return wallet;
  }

  // ───────────────────────────── Wallet APIs ─────────────────────────────

  async getBalance(payload: GetBalancePayload): Promise<void> {
    const channel = payload.token.userFields.channel;
    const userId = payload.token.userFields.id;

    try {
      const wallet = await this.getOrCreateWallet(userId);
      await this.responseService.sendSuccess(channel + "/getGemBalance", {
        balance: wallet.balance,
      });
    } catch (error) {
      this.logger.error("getBalance failed", error);
      await this.responseService.sendError(channel + "/getGemBalance", {
        message: "Failed to get gem balance",
      });
    }
  }

  async earnGems(payload: EarnGemsPayload): Promise<void> {
    const channel = payload.token.userFields.channel;
    const userId = payload.token.userFields.id;

    try {
      const amount = Math.max(0, payload.amount || 0);
      if (amount <= 0) {
        await this.responseService.sendError(channel + "/earnGems", {
          message: "Amount must be positive",
        });
        return;
      }

      const wallet = await this.getOrCreateWallet(userId);
      wallet.balance += amount;
      await wallet.save();

      this.logger.log(
        `User ${userId} earned ${amount} gems. New balance: ${wallet.balance}`,
      );

      await this.responseService.sendSuccess(channel + "/earnGems", {
        balance: wallet.balance,
      });
    } catch (error) {
      this.logger.error("earnGems failed", error);
      await this.responseService.sendError(channel + "/earnGems", {
        message: "Failed to earn gems",
      });
    }
  }

  async spendGems(payload: SpendGemsPayload): Promise<void> {
    const channel = payload.token.userFields.channel;
    const userId = payload.token.userFields.id;

    try {
      const amount = Math.max(0, payload.amount || 0);
      if (amount <= 0) {
        await this.responseService.sendError(channel + "/spendGems", {
          message: "Amount must be positive",
        });
        return;
      }

      const wallet = await this.getOrCreateWallet(userId);

      if (wallet.balance < amount) {
        await this.responseService.sendError(channel + "/spendGems", {
          message: "Not enough gems",
          balance: wallet.balance,
        });
        return;
      }

      wallet.balance -= amount;
      await wallet.save();

      this.logger.log(
        `User ${userId} spent ${amount} gems. New balance: ${wallet.balance}. Reason: ${payload.reason}`,
      );

      await this.responseService.sendSuccess(channel + "/spendGems", {
        balance: wallet.balance,
      });
    } catch (error) {
      this.logger.error("spendGems failed", error);
      await this.responseService.sendError(channel + "/spendGems", {
        message: "Failed to spend gems",
      });
    }
  }

  // ───────────────────────────── Gem Spawns ─────────────────────────────

  async createGemSpawn(payload: CreateGemSpawnPayload): Promise<void> {
    const channel = payload.token.userFields.channel;

    try {
      const def = await this.defModel
        .findOne({ id: payload.definitionId, isActive: true })
        .exec();

      if (!def) {
        await this.responseService.sendError(channel + "/createGemSpawn", {
          message: "Gem definition not found or inactive",
        });
        return;
      }

      const location = this.normalizeLocation(payload.location);
      if (!location) {
        await this.responseService.sendError(channel + "/createGemSpawn", {
          message: "Invalid spawn location",
        });
        return;
      }

      const spawn = new this.spawnModel({
        id: uuidv4(),
        definitionId: def.id,
        location,
        totalQuantity: payload.totalQuantity,
        remainingQuantity: payload.totalQuantity,
        pickupRadiusMeters: payload.pickupRadiusMeters ?? 50,
        startsAt: payload.startsAt ?? null,
        expiresAt: payload.expiresAt ?? null,
        isActive: true,
      });

      const saved = await spawn.save();

      await this.responseService.sendSuccess(
        channel + "/createGemSpawn",
        saved,
      );
    } catch (error) {
      this.logger.error("createGemSpawn failed", error);
      await this.responseService.sendError(channel + "/createGemSpawn", {
        message: "Failed to create gem spawn",
      });
    }
  }

  async searchNearbyGems(
    payload: SearchNearbyGemsPayload,
  ): Promise<void> {
    const channel = payload.token.userFields.channel;

    try {
      const loc = this.normalizeLocation(payload.location);
      if (!loc) {
        await this.responseService.sendError(channel + "/searchNearbyGems", {
          message: "Invalid location",
        });
        return;
      }

      const radius = payload.radiusMeters || 500;
      const limit = payload.limit ?? 50;

      const now = new Date();

      const spawns = await this.spawnModel
        .find({
          isActive: true,
          remainingQuantity: { $gt: 0 },
          $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
          $or2: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
          location: {
            $near: {
              $geometry: loc,
              $maxDistance: radius,
            },
          },
        } as any)
        .limit(limit)
        .lean()
        .exec();

      await this.responseService.sendSuccess(
        channel + "/searchNearbyGems",
        spawns,
      );
    } catch (error) {
      this.logger.error("searchNearbyGems failed", error);
      await this.responseService.sendError(channel + "/searchNearbyGems", {
        message: "Failed to search nearby gems",
      });
    }
  }

  async pickupGem(payload: PickupGemPayload): Promise<void> {
    const channel = payload.token.userFields.channel;
    const userId = payload.token.userFields.id;

    try {
      const loc = this.normalizeLocation(payload.location);
      if (!loc) {
        await this.responseService.sendError(channel + "/pickupGem", {
          message: "Invalid user location",
        });
        return;
      }

      const spawn = await this.spawnModel
        .findOne({ id: payload.spawnId })
        .exec();

      if (!spawn || !spawn.isActive) {
        await this.responseService.sendError(channel + "/pickupGem", {
          message: "Gem spawn not found or inactive",
        });
        return;
      }

      const now = new Date();

      if (spawn.startsAt && spawn.startsAt > now) {
        await this.responseService.sendError(channel + "/pickupGem", {
          message: "Gem spawn not started yet",
        });
        return;
      }

      if (spawn.expiresAt && spawn.expiresAt < now) {
        await this.responseService.sendError(channel + "/pickupGem", {
          message: "Gem spawn has expired",
        });
        return;
      }

      if (spawn.remainingQuantity <= 0) {
        await this.responseService.sendError(channel + "/pickupGem", {
          message: "No gems remaining in this spawn",
        });
        return;
      }

      // Calculate distance (rough, but enough for now)
      const [lng1, lat1] = spawn.location.coordinates;
      const [lng2, lat2] = loc.coordinates;
      const distanceMeters = this.haversineDistanceMeters(
        lat1,
        lng1,
        lat2,
        lng2,
      );

      if (distanceMeters > spawn.pickupRadiusMeters) {
        await this.responseService.sendError(channel + "/pickupGem", {
          message: "You are too far from this gem",
          distanceMeters,
        });
        return;
      }

      // For now: each pickup = 1 unit
      const amount = 1;

      // decrement remaining
      spawn.remainingQuantity -= amount;
      if (spawn.remainingQuantity <= 0) {
        spawn.remainingQuantity = 0;
        spawn.isActive = false;
      }
      await spawn.save();

      // credit wallet
      const wallet = await this.getOrCreateWallet(userId);
      wallet.balance += amount;
      await wallet.save();

      // log pickup
      const pickup = new this.pickupModel({
        id: uuidv4(),
        userId,
        spawnId: spawn.id,
        definitionId: spawn.definitionId,
        amount,
        userLocation: loc,
      });
      await pickup.save();

      this.logger.log(
        `User ${userId} picked gem from spawn ${spawn.id}, amount=${amount}, newBalance=${wallet.balance}`,
      );

      await this.responseService.sendSuccess(channel + "/pickupGem", {
        spawn,
        pickup,
        balance: wallet.balance,
      });
    } catch (error) {
      this.logger.error("pickupGem failed", error);
      await this.responseService.sendError(channel + "/pickupGem", {
        message: "Failed to pickup gem",
      });
    }
  }

  // Simple Haversine
  private haversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // m
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
