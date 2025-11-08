import { Module } from "@nestjs/common";
import { PublishesService } from "./publishes.service";
import { PublishesController } from "./publishes.controller";
import { ResponseService } from "../injection/response.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Publish, PublishSchema } from "./entities/publish.entity";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";
import { RequestService } from "../injection/request.service";

@Module({
  imports: [DatabaseConnectionModule, MongooseModule.forFeature([{ name: Publish.name, schema: PublishSchema }])],
  controllers: [PublishesController],
  providers: [PublishesService, ResponseService, RequestService]
})
export class PublishesModule {
}
