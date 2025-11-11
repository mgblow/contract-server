import { Module } from "@nestjs/common";
import { PublishesService } from "./publishes.service";
import { PublishesController } from "./publishes.controller";
import { ResponseService } from "../injection/response.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Publish, PublishSchema } from "./entities/publish.entity";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";
import { RequestService } from "../injection/request.service";
import { MeiliSearchService } from "./meilisearch.service";

@Module({
  imports: [DatabaseConnectionModule, MongooseModule.forFeature([{ name: Publish.name, schema: PublishSchema }])],
  controllers: [PublishesController],
  providers: [PublishesService, ResponseService, RequestService, MeiliSearchService]
})
export class PublishesModule {
}
