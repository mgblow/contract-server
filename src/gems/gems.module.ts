import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { GemDefinition, GemDefinitionSchema } from "./entities/gem-definition.entity";
import { GemSpawn, GemSpawnSchema } from "./entities/gem-spawn.entity";
import { GemPickup, GemPickupSchema } from "./entities/gem-pickup.entity";
import { GemWallet, GemWalletSchema } from "./entities/gem-wallet.entity";

import { GemsService } from "./gems.service";
import { GemsController } from "./gems.controller";

import { ResponseService } from "../injection/response.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GemDefinition.name, schema: GemDefinitionSchema },
      { name: GemSpawn.name, schema: GemSpawnSchema },
      { name: GemPickup.name, schema: GemPickupSchema },
      { name: GemWallet.name, schema: GemWalletSchema },
    ]),
  ],
  controllers: [GemsController],
  providers: [GemsService, ResponseService],
  exports: [GemsService],
})
export class GemsModule {}
