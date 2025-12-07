import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { GemsService } from "./gems.service";
import { GetBalancePayload } from "./dto/get-balance.payload";
import { EarnGemsPayload } from "./dto/earn-gems.payload";
import { SpendGemsPayload } from "./dto/spend-gems.payload";
import { CreateGemSpawnPayload } from "./dto/create-gem-spawn.payload";
import { SearchNearbyGemsPayload } from "./dto/search-nearby-gems.payload";
import { PickupGemPayload } from "./dto/pickup-gem.payload";

@Controller()
export class GemsController {
  private readonly logger = new Logger(GemsController.name);

  constructor(private readonly gemsService: GemsService) {}

  @MessagePattern("getGemBalance")
  getGemBalance(@Payload() payload: GetBalancePayload) {
    return this.gemsService.getBalance(payload);
  }

  @MessagePattern("earnGems")
  earnGems(@Payload() payload: EarnGemsPayload) {
    this.logger.log(
      `Received earnGems: ${JSON.stringify({
        amount: payload.amount,
        reason: payload.reason,
      })}`,
    );
    return this.gemsService.earnGems(payload);
  }

  @MessagePattern("spendGems")
  spendGems(@Payload() payload: SpendGemsPayload) {
    this.logger.log(
      `Received spendGems: ${JSON.stringify({
        amount: payload.amount,
        reason: payload.reason,
      })}`,
    );
    return this.gemsService.spendGems(payload);
  }

  @MessagePattern("createGemSpawn")
  createGemSpawn(@Payload() payload: CreateGemSpawnPayload) {
    this.logger.log(
      `Received createGemSpawn: ${JSON.stringify({
        definitionId: payload.definitionId,
        totalQuantity: payload.totalQuantity,
      })}`,
    );
    return this.gemsService.createGemSpawn(payload);
  }

  @MessagePattern("searchNearbyGems")
  searchNearbyGems(@Payload() payload: SearchNearbyGemsPayload) {
    return this.gemsService.searchNearbyGems(payload);
  }

  @MessagePattern("pickupGem")
  pickupGem(@Payload() payload: PickupGemPayload) {
    return this.gemsService.pickupGem(payload);
  }
}
