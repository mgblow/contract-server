import { PartialType } from "@nestjs/mapped-types";
import { CreateMessagePayload } from "./create-message.payload";

export class UpdateMessagePayload extends PartialType(CreateMessagePayload) {
  _id: string;
}
