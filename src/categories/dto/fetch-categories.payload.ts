import { PartialType } from "@nestjs/mapped-types";
import { CreateCategoryPayload } from "./create-category.payload";

export class FetchCategoriesPayload {
  token: any;
  limit: number;
  page: number;
}
