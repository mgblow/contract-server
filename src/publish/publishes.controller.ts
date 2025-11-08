import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { PublishesService } from "./publishes.service";
import { CreatePublishPayload } from "./dto/create-publish.payload";
import { UpdatePublishPayload } from "./dto/update-publish.payload";
import { DeletePublishPayload } from "./dto/delete-publish.payload";
import { FindPublishPayload } from "./dto/find-publish.payload";
import { SearchPublishesPayload } from "./dto/search-publishes.payload";
import { FetchPublishPayload } from "./dto/fetch-publish.payload";

@Controller()
export class PublishesController {
  constructor(private readonly publishesService: PublishesService) {
  }

  @MessagePattern("createPublish")
  createPublish(@Payload() createPublishDto: CreatePublishPayload) {
    return this.publishesService.create(createPublishDto);
  }

  @MessagePattern("updatePublish")
  updatePublish(@Payload() updatePublishDto: UpdatePublishPayload) {
    return this.publishesService.update(updatePublishDto);
  }

  @MessagePattern("deletePublish")
  deletePublish(@Payload() deletePublishDto: DeletePublishPayload) {
    return this.publishesService.delete(deletePublishDto);
  }

  @MessagePattern("findPublish")
  findPublish(@Payload() findPublishDto: FindPublishPayload) {
    return this.publishesService.findById(findPublishDto);
  }

  @MessagePattern("searchPublishs")
  searchPublishs(@Payload() searchPublishsDto: SearchPublishesPayload) {
    Logger.log("Received searchPublishs message with payload: " + JSON.stringify(searchPublishsDto));
    return this.publishesService.searchByQuery(searchPublishsDto);
  }

  @MessagePattern("fetchPublishs")
  fetchPublishs(@Payload() fetchPublishsDto: FetchPublishPayload) {
    return this.publishesService.fetchAll(fetchPublishsDto);
  }

}
