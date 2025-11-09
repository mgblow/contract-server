import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PicksService } from "./picks.service";
import { PicksController } from "./picks.controller";
import { Pick, PickSchema } from "./entities/pick.entity";
import { ResponseService } from "../injection/response.service";
import { MeiliSearchService } from "./meilisearch.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pick.name, schema: PickSchema },
    ])
  ],
  controllers: [PicksController],
  providers: [PicksService, ResponseService, MeiliSearchService],
  exports: [PicksService]
})
export class PicksModule {}
