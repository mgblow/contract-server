import { PartialType } from "@nestjs/mapped-types";
import { CreateBusinessPayload } from "./create-business.payload";

export class UpdateBusinessPayload extends PartialType(CreateBusinessPayload) {
  _id: string;
}
