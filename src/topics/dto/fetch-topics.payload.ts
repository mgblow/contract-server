import { PartialType } from "@nestjs/mapped-types";
import { CreateTopicPayload } from "./create-topic.payload";

export class FetchTopicsPayload {
  token: any;
  limit: number;
  page: number;
}
