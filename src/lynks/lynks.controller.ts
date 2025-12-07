import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { LynksService } from "./lynks.service";
import { CreateLynkPayload } from "./dto/create-lynk.payload";
import { ListLynksPayload } from "./dto/list-lynks.payload";
import { CreateLynkTexPayload } from "./dto/create-lynk-tex.payload";
import { ListLynkTexPayload } from "./dto/list-lynk-tex.payload";
import { SearchLynkTexesPayload } from "./dto/search-lynk-texes.payload";

@Controller()
export class LynksController {
  private readonly logger = new Logger(LynksController.name);

  constructor(private readonly lynksService: LynksService) {}

  @MessagePattern("createLynk")
  createLynk(@Payload() payload: CreateLynkPayload) {
    this.logger.log(`Received createLynk with payload: ${JSON.stringify(payload)}`);
    return this.lynksService.createLynk(payload);
  }

  @MessagePattern("listLynks")
  listLynks(@Payload() payload: ListLynksPayload) {
    this.logger.log(`Received listLynks with payload: ${JSON.stringify(payload)}`);
    return this.lynksService.listLynks(payload);
  }

  @MessagePattern("createLynkTex")
  createLynkTex(@Payload() payload: CreateLynkTexPayload) {
    this.logger.log(
      `Received createLynkTex with payload: ${JSON.stringify(payload)}`,
    );
    return this.lynksService.createLynkTex(payload);
  }

  @MessagePattern("listLynkTex")
  listLynkTex(@Payload() payload: ListLynkTexPayload) {
    this.logger.log(
      `Received listLynkTex with payload: ${JSON.stringify(payload)}`,
    );
    return this.lynksService.listLynkTex(payload);
  }

  @MessagePattern("searchLynkTexes")
  searchLynkTexes(@Payload() payload: SearchLynkTexesPayload) {
    this.logger.log(
      `Received searchLynkTexes with payload: ${JSON.stringify(payload)}`,
    );
    return this.lynksService.searchLynkTexes(payload);
  }

  // Optional:
  // @MessagePattern("markLynkAsRead")
  // markLynkAsRead(@Payload() payload: { token: any; lynkId: string }) {
  //   const channel = payload.token.userFields.channel;
  //   const userId = payload.token.userFields.id;
  //   return this.lynksService.markLynkAsRead(payload.lynkId, userId, channel);
  // }
}
