import { PartialType } from "@nestjs/mapped-types";
import { CreateTopicPayload } from "./create-topic.payload";

export class UpdateTopicPayload extends PartialType(CreateTopicPayload) {
  _id: string;
}
