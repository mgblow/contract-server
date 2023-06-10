import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateBusinessPayload } from "./dto/create-business.payload";
import { Business } from "./entities/business.entity";
import { UpdateBusinessPayload } from "./dto/update-business.payload";
import { ResponseService } from "../injection/response.service";
import { DeleteBusinessPayload } from "./dto/delete-business.payload";
import { FetchBusinessesPayload } from "./dto/fetch-businesses.payload";
import { FindBusinessPayload } from "./dto/find-business.payload";
import { SearchBusinessesPayload } from "./dto/search-businesses.payload";

@Injectable()
export class BusinessesService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<Business>,
    private readonly responseService: ResponseService
  ) {
  }

  async create(createBusinessDto: CreateBusinessPayload): Promise<void> {
    const userBusinessCount = await this.businessModel.countDocuments({ userId: createBusinessDto.token.userFields.id });
    if (userBusinessCount >= 2) {
      await this.responseService.sendError(createBusinessDto.token.userFields.channel + "/createBusiness", {
        "business.count": "You cannot create more than 3 businesses."
      });
      return;
    }
    createBusinessDto.userId = createBusinessDto.token.userFields.id;
    const createdBusiness = new this.businessModel(createBusinessDto);
    const business = await createdBusiness.save();
    await this.responseService.sendSuccess(createBusinessDto.token.userFields.channel + "/createBusiness", business);
  }


  async update(updateBusinessDto: UpdateBusinessPayload): Promise<void> {
    const existingBusiness = await this.businessModel.findById(updateBusinessDto._id).exec();
    if (!existingBusiness) {
      await this.responseService.sendError(updateBusinessDto.token.userFields.channel + "/updateBusiness", {
        "category._id": "category _id does not exists"
      });
    }
    existingBusiness.set(updateBusinessDto);
    const updatedBusiness = await existingBusiness.save();
    await this.responseService.sendSuccess(updateBusinessDto.token.userFields.channel + "/updateBusiness", updatedBusiness);
  }


  async searchByQuery(searchBusinessesDto: SearchBusinessesPayload): Promise<void> {
    const regex = new RegExp(searchBusinessesDto.query, "i");
    const [businesses, total] = await Promise.all([
      this.businessModel.find({
        $or: [
          { name: regex },
          { about: regex }
        ]
      }).limit(searchBusinessesDto.limit).skip(searchBusinessesDto.limit * (searchBusinessesDto.page - 1)).exec(),
      this.businessModel.countDocuments({
        $or: [
          { name: regex },
          { about: regex }
        ]
      })
    ]);
    await this.responseService.sendSuccess(searchBusinessesDto.token.userFields.channel + "/searchBusinesses", { businesses, total });
  }


  async fetchAll(fetchBusinessesDto: FetchBusinessesPayload): Promise<void> {
    const [categories, total] = await Promise.all([
      this.businessModel.find().populate("categoryId").limit(fetchBusinessesDto.limit).skip(fetchBusinessesDto.limit * (fetchBusinessesDto.page - 1)).exec(),
      this.businessModel.countDocuments()
    ]);
    await this.responseService.sendSuccess(fetchBusinessesDto.token.userFields.channel + "/fetchBusinesses", { categories, total });
  }

  async delete(deleteBusinessDto: DeleteBusinessPayload): Promise<void> {
    const deleted = await this.businessModel.deleteOne({ _id: deleteBusinessDto._id }).exec();
    await this.responseService.sendSuccess(deleteBusinessDto.token.userFields.channel + "/deleteBusiness", deleted);
  }

  async findById(findBusinessDto: FindBusinessPayload): Promise<void> {
    const category = await this.businessModel.findById(findBusinessDto._id).populate("categoryId").exec();
    await this.responseService.sendSuccess(findBusinessDto.token.userFields.channel + "/findBusiness", category);
  }

}
