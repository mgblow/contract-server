import { PartialType } from "@nestjs/mapped-types";
import { CreateCategoryPayload } from "./create-category.payload";

export class UpdateCategoryPayload extends PartialType(CreateCategoryPayload) {
  _id: string;
}
