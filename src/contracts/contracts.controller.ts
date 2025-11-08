import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ContractsService } from "./contracts.service";
import { CreateContractPayload } from "./dto/create-contract.payload";
import { UpdateContractPayload } from "./dto/update-contract.payload";
import { DeleteContractPayload } from "./dto/delete-contract.payload";
import { FindContractPayload } from "./dto/find-contract.payload";
import { SearchContractsPayload } from "./dto/search-contracts.payload";
import { FetchContractsPayload } from "./dto/fetch-contracts.payload";

@Controller()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {
  }

  @MessagePattern("createContract")
  createContract(@Payload() createContractDto: CreateContractPayload) {
    return this.contractsService.create(createContractDto);
  }

  @MessagePattern("updateContract")
  updateContract(@Payload() updateContractDto: UpdateContractPayload) {
    return this.contractsService.update(updateContractDto);
  }

  @MessagePattern("deleteContract")
  deleteContract(@Payload() deleteContractDto: DeleteContractPayload) {
    return this.contractsService.delete(deleteContractDto);
  }

  @MessagePattern("findContract")
  findContract(@Payload() findContractDto: FindContractPayload) {
    return this.contractsService.findById(findContractDto);
  }

  @MessagePattern("searchContracts")
  searchContracts(@Payload() searchContractsDto: SearchContractsPayload) {
    Logger.log("Received searchContracts message with payload: " + JSON.stringify(searchContractsDto));
    return this.contractsService.searchByQuery(searchContractsDto);
  }

  @MessagePattern("fetchContracts")
  fetchContracts(@Payload() fetchContractsDto: FetchContractsPayload) {
    return this.contractsService.fetchAll(fetchContractsDto);
  }

}
