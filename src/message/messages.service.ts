import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateMessagePayload } from "./dto/create-message.payload";
import { Message } from "./entities/message.entity";
import { UpdateMessagePayload } from "./dto/update-message.payload";
import { ResponseService } from "../injection/response.service";
import { DeleteMessagePayload } from "./dto/delete-message.payload";
import { FetchMessagesPayload } from "./dto/fetch-messages.payload";
import { FindMessagePayload } from "./dto/find-message.payload";
import { RequestService } from "../injection/request.service";

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private readonly requestService: RequestService,
    private readonly responseService: ResponseService
  ) {
  }

  async create(createMessagePayload: CreateMessagePayload): Promise<void> {
    const findReceiver = JSON.parse(await this.requestService.send("findUser", {
      token: createMessagePayload.token,
      _id: createMessagePayload.receiverUserId
    }));
    if (!findReceiver.data.success) {
      await this.responseService.sendError(createMessagePayload.token.userFields.channel, {
        "message.receiverUserId": "receiverUserId does not exists"
      });
    }
    createMessagePayload.senderUserId = createMessagePayload.token.userFields.id;
    const createdMessage = new this.messageModel(createMessagePayload);
    const message = await createdMessage.save();
    await this.responseService.sendSuccess(createMessagePayload.token.userFields.channel + "/createMessage", message);
  }


  async update(updateMessagePayload: UpdateMessagePayload): Promise<void> {
    const existingMessage = await this.messageModel.find({
      _id: updateMessagePayload._id,
      senderUserId: updateMessagePayload.token.userFields._id
    }).exec();
    if (!existingMessage) {
      await this.responseService.sendError(updateMessagePayload.token.userFields.channel, {
        "message._id": "message _id does not exists"
      });
    }
    //   existingMessage.set(updateMessagePayload);
    //   const updatedOption = await existingMessage.save();
    //   await this.responseService.sendSuccess(updateMessagePayload.token.userFields.channel, updatedOption);
  }

  async fetchAll(fetchMessagesPayload: FetchMessagesPayload): Promise<void> {
    const [messages, total] = await Promise.all([
      this.messageModel.find({
        senderUserId: fetchMessagesPayload.token.userFields._id
      }).limit(fetchMessagesPayload.limit).skip(fetchMessagesPayload.limit * (fetchMessagesPayload.page - 1)).exec(),
      this.messageModel.countDocuments()
    ]);
    await this.responseService.sendSuccess(fetchMessagesPayload.token.userFields.channel, {
      categories: messages,
      total
    });
  }

  async delete(deleteMessagePayload: DeleteMessagePayload): Promise<void> {
    const deleted = await this.messageModel.deleteOne({
      _id: deleteMessagePayload._id,
      senderUserId: deleteMessagePayload.token.userFields._id
    }).exec();
    await this.responseService.sendSuccess(deleteMessagePayload.token.userFields.channel, deleted);
  }

  async findById(findMessagePayload: FindMessagePayload): Promise<void> {
    const update = await this.messageModel.find({
      _id: findMessagePayload._id,
      senderUserId: findMessagePayload.token.userFields._id
    }).exec();
    await this.responseService.sendSuccess(findMessagePayload.token.userFields.channel, update);
  }

}
