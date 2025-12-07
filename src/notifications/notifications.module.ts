import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { EmqxClientService } from "./emqx-client.service";
import { ResponseService } from "../injection/response.service";

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmqxClientService, ResponseService],
  exports: [NotificationsService, EmqxClientService],
})
export class NotificationsModule {}
