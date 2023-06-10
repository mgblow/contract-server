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
  createLabel(@Payload() createLabelDto: CreatelabelPayload) {
    return this.labelsService.create(createLabelDto);
  }

  @MessagePattern("deleteLabel")
  deleteLabel(@Payload() deleteLabelDto: DeleteLabelPayload) {
    return this.labelsService.delete(deleteLabelDto);
  }

  @MessagePattern("findLabel")
  findLabel(@Payload() findLabelDto: FindLabelPayload) {
    return this.labelsService.findById(findLabelDto);
  }

  @MessagePattern("searchLabeles")
  searchLabeles(@Payload() searchLabelesDto: SearchLabelsPayload) {
    return this.labelsService.searchByQuery(searchLabelesDto);
  }

  @MessagePattern("fetchLabeles")
  fetchLabeles(@Payload() fetchLabelesDto: FetchLabelsPayload) {
    return this.labelsService.fetchAll(fetchLabelesDto);
  }

}
