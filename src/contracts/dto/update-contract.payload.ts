import { PartialType } from "@nestjs/mapped-types";
import { CreateContractPayload } from "./create-contract.payload";

export class UpdateContractPayload extends PartialType(CreateContractPayload) {
  _id: string;
}
