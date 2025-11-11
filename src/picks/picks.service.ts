import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Pick } from "./entities/pick.entity";
import { CreatePickDto } from "./dto/create-pick.dto";
import { ResponseService } from "../injection/response.service";
import { MeiliSearchService } from "./meilisearch.service"; // Adjust path if needed
import { avatarPicks } from "./config/person.avatar.config";
import { profilePicks } from "./config/person.profile.config";

@Injectable()
export class PicksService {
  constructor(
    @InjectModel(Pick.name) private readonly pickModel: Model<Pick>,
    private readonly responseService: ResponseService,
    private readonly meiliService: MeiliSearchService,
  ) {}

  // --- Create Pick ---
  async createPick(dto: CreatePickDto) {
    try {
      const pick = new this.pickModel(dto);
      await pick.save();
      await this.indexPick(pick);

      return this.responseService.sendSuccess(
        dto.token.userFields.channel + "/createPick",
        pick,
      );
    } catch (error) {
      return this.responseService.sendError(
        dto.token.userFields.channel + "/createPick",
        { error: error.message || "Failed to create pick" },
      );
    }
  }

  // --- List Picks (optionally by type) ---
  async listPicks(dto: any) {
    try {
      const filter = dto.type ? { type: dto.type } : {};
      const picks = await this.pickModel.find(filter).lean();

      return this.responseService.sendSuccess(
        dto.token.userFields.channel + "/listPicks",
        picks,
      );
    } catch (error) {
      return this.responseService.sendError(
        dto.token.userFields.channel + "/listPicks",
        { error: error.message || "Failed to fetch picks" },
      );
    }
  }


  // --- Get Pick Config (from static configs) ---
  async getAvatarPickConfig(dto: { token: any }) {
    try {
      // Helper function to filter free picks recursively
      const filterFreePicks = (picks: Record<string, any[]>) => {
        const filtered: Record<string, any[]> = {};
        for (const [category, items] of Object.entries(picks)) {
          filtered[category] = items.filter(item => item.isPaid === false);
        }
        return filtered;
      };

      const freeAvatarPicks = filterFreePicks(avatarPicks);
      const freeProfilePicks = filterFreePicks(profilePicks);

      const config = {
        avatarPicks: freeAvatarPicks,
        profilePicks: freeProfilePicks,
      };
      return this.responseService.sendSuccess(
        dto.token.userFields.channel + "/getAvatarPickConfig",
        config,
      );
    } catch (error) {
      return this.responseService.sendError(
        dto.token.userFields.channel + "/getAvatarPickConfig",
        { error: error.message || "Failed to fetch pick config" },
      );
    }
  }

  // --- Search Picks (via MeiliSearch) ---
  async searchPicks(dto: {
    token: any;
    query: string;
    type?: string;
    filters?: string;
    limit?: number;
    page?: number;
    sort?: string[];
  }) {
    try {
      const { query, filters, limit = 20, page = 1, sort } = dto;
      const offset = (page - 1) * limit;

      const result = await this.meiliService.searchPicks(
        query,
        filters,
        limit,
        offset,
        sort,
      );

      return this.responseService.sendSuccess(
        dto.token.userFields.channel + "/searchPicks",
        result,
      );
    } catch (error) {
      return this.responseService.sendError(
        dto.token.userFields.channel + "/searchPicks",
        { error: error.message || "Failed to search picks" },
      );
    }
  }

  // --- Delete Pick ---
  async deletePick(dto: { token: any; id: string }) {
    try {
      await this.pickModel.deleteOne({ _id: dto.id });
      await this.meiliService.deletePick(dto.id);

      return this.responseService.sendSuccess(
        dto.token.userFields.channel + "/deletePick",
        { id: dto.id },
      );
    } catch (error) {
      return this.responseService.sendError(
        dto.token.userFields.channel + "/deletePick",
        { error: error.message || "Failed to delete pick" },
      );
    }
  }

  // --- Index Pick to MeiliSearch ---
  private async indexPick(pick: Pick) {
    await this.meiliService.addOrUpdatePick({
      id: pick._id.toString(),
      name: pick.name,
      type: pick.type,
      price: pick.price,
      config: pick.config,
      isActive: pick.isActive,
      createdAt: pick.createdAt,
      updatedAt: pick.updatedAt,
    });
  }

  completeTransaction(id: string) {

  }
}
