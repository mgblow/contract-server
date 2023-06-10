import { Module } from "@nestjs/common";
import { ContractsService } from "./contracts.service";
import { ContractsController } from "./contracts.controller";
import { ResponseService } from "../injection/response.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Contract, ContractSchema } from "./entities/contract.entity";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";
import { RequestService } from "../injection/request.service";

@Module({
  imports: [DatabaseConnectionModule, MongooseModule.forFeature([{ name: Contract.name, schema: ContractSchema }])],
  controllers: [ContractsController],
  providers: [ContractsService, ResponseService, RequestService]
})
export class ContractsModule {
}
