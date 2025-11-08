import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateContractPayload } from "./dto/create-contract.payload";
import { Contract } from "./entities/contract.entity";
import { UpdateContractPayload } from "./dto/update-contract.payload";
import { ResponseService } from "../injection/response.service";
import { DeleteContractPayload } from "./dto/delete-contract.payload";
import { FetchContractsPayload } from "./dto/fetch-contracts.payload";
import { FindContractPayload } from "./dto/find-contract.payload";
import { SearchContractsPayload } from "./dto/search-contracts.payload";
import { RequestService } from "../injection/request.service";

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<Contract>,
    private readonly requestService: RequestService,
    private readonly responseService: ResponseService
  ) {
  }

  async create(createContractPayload: CreateContractPayload): Promise<void> {
    const findCategory = JSON.parse(await this.requestService.send("findCategory", {
      token: createContractPayload.token,
      _id: createContractPayload.categoryId
    }));
    if (!findCategory.data.success) {
      await this.responseService.sendError(createContractPayload.token.userFields.channel, {
        "category._id": "category _id does not exists"
      });
    }
    // fetch category's options
    findCategory.data.body.options.forEach(option => {
      // options should be equal to category's options
    });
    createContractPayload.userId = createContractPayload.token.userFields.id;
    const createdContract = new this.contractModel(createContractPayload);
    const contract = await createdContract.save();
    await this.responseService.sendSuccess(createContractPayload.token.userFields.channel + "/createContract", contract);
  }


  async update(updateContractPayload: UpdateContractPayload): Promise<void> {
    const existingContract = await this.contractModel.findById(updateContractPayload._id).exec();
    if (!existingContract) {
      await this.responseService.sendError(updateContractPayload.token.userFields.channel, {
        "contract._id": "contract _id does not exists"
      });
    }
    existingContract.set(updateContractPayload);
    const updatedOption = await existingContract.save();
    await this.responseService.sendSuccess(updateContractPayload.token.userFields.channel + "/updateContract", updatedOption);
  }


  async searchByQuery(searchContractsPayload: SearchContractsPayload): Promise<void> {
    const regex = new RegExp(searchContractsPayload.query, "i");
    const [contracts, total] = await Promise.all([
      this.contractModel.find({
        $or: [
          { text: regex }
        ]
      }).limit(searchContractsPayload.limit).skip(searchContractsPayload.limit * (searchContractsPayload.page - 1)).exec(),
      this.contractModel.countDocuments({
        $or: [
          { text: regex }
        ]
      })
    ]);
    Logger.log(`Found ${total} contracts matching query "${searchContractsPayload.query}"`);
    await this.responseService.sendSuccess(searchContractsPayload.token.userFields.channel + "/searchContracts", {
      publishes: contracts,
      total: total
    });
  }


  async fetchAll(fetchContractsPayload: FetchContractsPayload): Promise<void> {
    const [contracts, total] = await Promise.all([
      this.contractModel.find().limit(fetchContractsPayload.limit).skip(fetchContractsPayload.limit * (fetchContractsPayload.page - 1)).exec(),
      this.contractModel.countDocuments()
    ]);
    await this.responseService.sendSuccess(fetchContractsPayload.token.userFields.channel + "/fetchContracts", {
      categories: contracts,
      total
    });
  }

  async delete(deleteContractPayload: DeleteContractPayload): Promise<void> {
    const deleted = await this.contractModel.deleteOne({ _id: deleteContractPayload._id }).exec();
    await this.responseService.sendSuccess(deleteContractPayload.token.userFields.channel + "/deleteContract", deleted);
  }

  async findById(findContractPayload: FindContractPayload): Promise<void> {
    const update = await this.contractModel.findById(findContractPayload._id).exec();
    await this.responseService.sendSuccess(findContractPayload.token.userFields.channel + "/findContract", update);
  }

}
