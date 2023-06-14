import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { LabelsService } from "./labels.service";
import { CreatelabelPayload } from "./dto/createlabel.payload";
import { DeleteLabelPayload } from "./dto/delete-label.payload";
import { FindLabelPayload } from "./dto/find-label.payload";
import { SearchLabelsPayload } from "./dto/search-labels.payload";
import { FetchLabelsPayload } from "./dto/fetch-labels.payload";

@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {
  }

  @MessagePattern("createLabel")
  createLabel(@Payload() createLabelPayloadDto: CreatelabelPayload) {
    return this.labelsService.create(createLabelPayloadDto);
  }

  @MessagePattern("deleteLabel")
  deleteLabel(@Payload() deleteLabelPayloadDto: DeleteLabelPayload) {
    return this.labelsService.delete(deleteLabelPayloadDto);
  }

  @MessagePattern("findLabel")
  findLabel(@Payload() findLabelPayloadDto: FindLabelPayload) {
    return this.labelsService.findById(findLabelPayloadDto);
  }

  @MessagePattern("searchLabeles")
  searchLabeles(@Payload() searchLabelesPayloadDto: SearchLabelsPayload) {
    return this.labelsService.searchByQuery(searchLabelesPayloadDto);
  }

  @MessagePattern("fetchLabeles")
  fetchLabeles(@Payload() fetchLabelesPayloadDto: FetchLabelsPayload) {
    return this.labelsService.fetchAll(fetchLabelesPayloadDto);
  }

}
