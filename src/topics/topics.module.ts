import { Module } from "@nestjs/common";
import { TopicsService } from "./topics.service";
import { TopicsController } from "./topics.controller";
import { ResponseService } from "../injection/response.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Topic, TopicSchema } from "./entities/topic.entity";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";

@Module({
  imports: [DatabaseConnectionModule, MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }])],
  controllers: [TopicsController],
  providers: [TopicsService, ResponseService]
})
export class TopicsModule {
}
