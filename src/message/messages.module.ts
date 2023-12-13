import { Module } from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { MessagesController } from "./messages.controller";
import { ResponseService } from "../injection/response.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Message, MessageSchema } from "./entities/message.entity";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";
import { RequestService } from "../injection/request.service";

@Module({
  imports: [DatabaseConnectionModule, MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }])],
  controllers: [MessagesController],
  providers: [MessagesService, ResponseService, RequestService]
})
export class MessagesModule {
}
