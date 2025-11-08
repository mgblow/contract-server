import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { TopicsService } from "./topics.service";
import { CreateTopicPayload } from "./dto/create-topic.payload";
import { UpdateTopicPayload } from "./dto/update-topic.payload";
import { DeleteTopicPayload } from "./dto/delete-topic.payload";
import { FindTopicPayload } from "./dto/find-topic.payload";
import { SearchTopicsPayload } from "./dto/search-topics.payload";
import { FetchTopicsPayload } from "./dto/fetch-topics.payload";

@Controller()
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {
  }

  @MessagePattern("createTopic")
  createTopic(@Payload() createTopicDto: CreateTopicPayload) {
    return this.topicsService.create(createTopicDto);
  }

  @MessagePattern("updateTopic")
  updateTopic(@Payload() updateTopicDto: UpdateTopicPayload) {
    return this.topicsService.update(updateTopicDto);
  }

  @MessagePattern("deleteTopic")
  deleteTopic(@Payload() deleteTopicDto: DeleteTopicPayload) {
    return this.topicsService.delete(deleteTopicDto);
  }

  @MessagePattern("findTopic")
  findTopic(@Payload() findTopicDto: FindTopicPayload) {
    return this.topicsService.findById(findTopicDto);
  }

  @MessagePattern("searchTopics")
  searchTopics(@Payload() searchTopicsDto: SearchTopicsPayload) {
    return this.topicsService.searchByQuery(searchTopicsDto);
  }

  @MessagePattern("fetchTopics")
  fetchTopics(@Payload() fetchTopicsDto: FetchTopicsPayload) {
    return this.topicsService.fetchAll(fetchTopicsDto);
  }

}
