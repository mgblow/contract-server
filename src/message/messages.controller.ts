import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { MessagesService } from "./messages.service";
import { CreateMessagePayload } from "./dto/create-message.payload";
import { UpdateMessagePayload } from "./dto/update-message.payload";
import { DeleteMessagePayload } from "./dto/delete-message.payload";
import { FindMessagePayload } from "./dto/find-message.payload";
import { SearchMessagesPayload } from "./dto/search-messages.payload";
import { FetchMessagesPayload } from "./dto/fetch-messages.payload";

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {
  }

  @MessagePattern("createMessage")
  createMessage(@Payload() createMessageDto: CreateMessagePayload) {
    return this.messagesService.create(createMessageDto);
  }

  @MessagePattern("updateMessage")
  updateMessage(@Payload() updateMessageDto: UpdateMessagePayload) {
    return this.messagesService.update(updateMessageDto);
  }

  @MessagePattern("deleteMessage")
  deleteMessage(@Payload() deleteMessageDto: DeleteMessagePayload) {
    return this.messagesService.delete(deleteMessageDto);
  }

  @MessagePattern("findMessage")
  findMessage(@Payload() findMessageDto: FindMessagePayload) {
    return this.messagesService.findById(findMessageDto);
  }

  // @MessagePattern("searchMessages")
  // searchMessages(@Payload() searchMessagesDto: SearchMessagesPayload) {
  //   return this.messagesService.searchByQuery(searchMessagesDto);
  // }

  @MessagePattern("fetchMessages")
  fetchMessages(@Payload() fetchMessagesDto: FetchMessagesPayload) {
    return this.messagesService.fetchAll(fetchMessagesDto);
  }

}
