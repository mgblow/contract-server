import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { PicksService } from "./picks.service";
import { CreatePickDto } from "./dto/create-pick.dto";

@Controller()
export class PicksController {
  constructor(private readonly picksService: PicksService) {}

  @MessagePattern('createPick')
  createPick(@Payload() dto: CreatePickDto) {
    return this.picksService.createPick(dto);
  }

  @MessagePattern('listPicks')
  listPicks(@Payload() payload: { type?: string }) {
    return this.picksService.listPicks(payload?.type);
  }

  @MessagePattern('completePickTransaction')
  completePickTransaction(@Payload() payload: { id: string }) {
    return this.picksService.completeTransaction(payload.id);
  }

  @MessagePattern('getAvatarPickConfig')
  getPickConfig(dto: { token: any }) {
    return this.picksService.getAvatarPickConfig(dto);
  }
}
