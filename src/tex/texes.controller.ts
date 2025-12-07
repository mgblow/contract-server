import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { TexesService } from "./texes.service";
import { CreateTexPayload } from "./dto/create-tex.payload";
import { UpdateTexPayload } from "./dto/update-tex.payload";
import { DeleteTexPayload } from "./dto/delete-tex.payload";
import { FindTexPayload } from "./dto/find-tex.payload";
import { SearchTexesPayload } from "./dto/search-texes.payload";
import { FetchTexPayload } from "./dto/fetch-tex.payload";

@Controller()
export class TexesController {
  constructor(private readonly publishesService: TexesService) {
  }

  @MessagePattern("createTex")
  createTex(@Payload() createTexDto: CreateTexPayload) {
    return this.publishesService.create(createTexDto);
  }

  @MessagePattern("updateTex")
  updateTex(@Payload() updateTexDto: UpdateTexPayload) {
    return this.publishesService.update(updateTexDto);
  }

  @MessagePattern("deleteTex")
  deleteTex(@Payload() deleteTexDto: DeleteTexPayload) {
    return this.publishesService.delete(deleteTexDto);
  }

  @MessagePattern("findTex")
  findTex(@Payload() findTexDto: FindTexPayload) {
    return this.publishesService.findById(findTexDto);
  }

  @MessagePattern("searchTexes")
  searchTexes(@Payload() searchTexesDto: SearchTexesPayload) {
    Logger.log("Received searchTexes message with payload: " + JSON.stringify(searchTexesDto));
    return this.publishesService.searchByQuery(searchTexesDto);
  }

  @MessagePattern("fetchTexes")
  fetchTexes(@Payload() fetchTexesDto: FetchTexPayload) {
    return this.publishesService.fetchAll(fetchTexesDto);
  }


  @MessagePattern("getTexes")
  findTexes(@Payload() payload: {
    token: any,
    personId: string;
    fromDate?: Date;
    toDate?: Date;
    isPublic?: boolean;
    limit?: number;
  }) {
    return this.publishesService.getTexes(payload);
  }

}
