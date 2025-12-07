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
  private readonly logger = new Logger(TexesController.name);

  constructor(private readonly texesService: TexesService) {}

  @MessagePattern("createTex")
  createTex(@Payload() payload: CreateTexPayload) {
    this.logger.log(
      `Received createTex with payload: ${JSON.stringify(payload)}`,
    );
    return this.texesService.create(payload);
  }

  @MessagePattern("updateTex")
  updateTex(@Payload() payload: UpdateTexPayload) {
    this.logger.log(
      `Received updateTex with payload: ${JSON.stringify(payload)}`,
    );
    return this.texesService.update(payload);
  }

  @MessagePattern("deleteTex")
  deleteTex(@Payload() payload: DeleteTexPayload) {
    this.logger.log(
      `Received deleteTex with payload: ${JSON.stringify(payload)}`,
    );
    return this.texesService.delete(payload);
  }

  @MessagePattern("findTex")
  findTex(@Payload() payload: FindTexPayload) {
    return this.texesService.findById(payload);
  }

  @MessagePattern("searchTexes")
  searchTexes(@Payload() payload: SearchTexesPayload) {
    this.logger.log(
      "Received searchTexes message with payload: " +
      JSON.stringify(payload),
    );
    return this.texesService.searchByQuery(payload);
  }

  @MessagePattern("fetchTexes")
  fetchTexes(@Payload() payload: FetchTexPayload) {
    return this.texesService.fetchAll(payload);
  }

  @MessagePattern("getTexes")
  getTexes(
    @Payload()
    payload: {
      token: any;
      personId: string;
      fromDate?: Date;
      toDate?: Date;
      isPublic?: boolean;
      limit?: number;
    },
  ) {
    return this.texesService.getTexes(payload);
  }

  // You can later add:
  // @MessagePattern("reindexTexes") → this.texesService.reindexAll(...)
  // @MessagePattern("getTexSearchStats") → this.texesService.getSearchStats(...)
}
