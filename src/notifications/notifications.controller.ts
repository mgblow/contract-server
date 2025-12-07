import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { NotificationsService } from "./notifications.service";

import { SendToUserPayload } from "./dto/send-to-user.payload";
import { SendToChannelPayload } from "./dto/send-to-channel.payload";
import { SendLynkEventPayload } from "./dto/send-lynk-event.payload";
import { GetUserStatusPayload } from "./dto/get-user-status.payload";
import { BroadcastPayload } from "./dto/broadcast.payload";

import { ResponseService } from "../injection/response.service";

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly responseService: ResponseService,
  ) {}

  @MessagePattern("notify.sendToUser")
  async sendToUser(@Payload() payload: SendToUserPayload) {
    this.logger.debug(
      `notify.sendToUser from=${payload.token?.userFields?.id} to=${payload.targetUserId} event=${payload.event}`,
    );
    await this.notificationsService.sendToUser(payload);
  }

  @MessagePattern("notify.sendToChannel")
  async sendToChannel(@Payload() payload: SendToChannelPayload) {
    this.logger.debug(
      `notify.sendToChannel channel=${payload.channel} event=${payload.event}`,
    );
    await this.notificationsService.sendToChannel(payload);
  }

  @MessagePattern("notify.sendLynkEvent")
  async sendLynkEvent(@Payload() payload: SendLynkEventPayload) {
    this.logger.debug(
      `notify.sendLynkEvent lynkId=${payload.lynkId} from=${payload.fromUserId} to=${payload.toUserId} event=${payload.event}`,
    );
    await this.notificationsService.sendLynkEvent(payload);
  }

  @MessagePattern("notify.getUserStatus")
  async getUserStatus(@Payload() payload: GetUserStatusPayload) {
    const channel = payload.token.userFields.channel;
    const result = await this.notificationsService.getUserStatus(payload);
    await this.responseService.sendSuccess(
      channel + "/notify.getUserStatus",
      result,
    );
  }

  @MessagePattern("notify.broadcast")
  async broadcast(@Payload() payload: BroadcastPayload) {
    this.logger.log(
      `notify.broadcast event=${payload.event} by=${payload.token?.userFields?.id}`,
    );
    await this.notificationsService.broadcast(payload);
  }
}
