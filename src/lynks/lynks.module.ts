import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Lynk, LynkSchema } from "./entities/lynk.entity";
import { LynkTex, LynkTexSchema } from "./entities/lynk-tex.entity";

import { LynksService } from "./lynks.service";
import { LynksController } from "./lynks.controller";
import { LynksMeiliSearchService } from "./meilisearch.service";

import { ResponseService } from "../injection/response.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lynk.name, schema: LynkSchema },
      { name: LynkTex.name, schema: LynkTexSchema },
    ]),
  ],
  controllers: [LynksController],
  providers: [LynksService, LynksMeiliSearchService, ResponseService],
  exports: [LynksService],
})
export class LynksModule {}
