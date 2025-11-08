import { PartialType } from "@nestjs/mapped-types";
import { CreatePublishPayload } from "./create-publish.payload";

export class UpdatePublishPayload extends PartialType(CreatePublishPayload) {
  _id: string;
}
