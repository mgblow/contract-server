import { PartialType } from "@nestjs/mapped-types";
import { CreatelabelPayload } from "./createlabel.payload";

export class UpdateLabelPayload extends PartialType(CreatelabelPayload) {
  _id: string;
}
