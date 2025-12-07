import { PartialType } from "@nestjs/mapped-types";
import { CreateTexPayload } from "./create-tex.payload";

export class UpdateTexPayload extends PartialType(CreateTexPayload) {
  _id: string;
}
