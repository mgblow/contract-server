import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreatelabelPayload } from "./dto/createlabel.payload";
import { Label } from "./entities/label.entity";
import { UpdateLabelPayload } from "./dto/update-label.payload";
import { ResponseService } from "../injection/response.service";
import { DeleteLabelPayload } from "./dto/delete-label.payload";
import { FetchLabelsPayload } from "./dto/fetch-labels.payload";
import { FindLabelPayload } from "./dto/find-label.payload";
import { SearchLabelsPayload } from "./dto/search-labels.payload";

@Injectable()
export class LabelsService {
  constructor(
    @InjectModel(Label.name) private createdLabel: Model<Label>,
    private readonly responseService: ResponseService
  ) {
  }

  async create(createlabelPayload: CreatelabelPayload): Promise<void> {
    const userLabelsCount = await this.createdLabel.countDocuments({ userId: createlabelPayload.token.userFields.id });
    if (userLabelsCount >= 2) {
      await this.responseService.sendError(createlabelPayload.token.userFields.channel, {
        "business.count": "You cannot create more than 3 businesses."
      });
      return;
    }
    createlabelPayload.userId = createlabelPayload.token.userFields.id;
    const labelModel = new this.createdLabel(createlabelPayload);
    const label = await labelModel.save();
    await this.responseService.sendSuccess(createlabelPayload.token.userFields.channel, label);
  }


  async searchByQuery(searchLabelsPayload: SearchLabelsPayload): Promise<void> {
    const regex = new RegExp(searchLabelsPayload.query, "i");
    const [labels, total] = await Promise.all([
      this.createdLabel.find({
        $or: [
          { name: regex },
          { about: regex }
        ]
      }).limit(searchLabelsPayload.limit).skip(searchLabelsPayload.limit * (searchLabelsPayload.page - 1)).exec(),
      this.createdLabel.countDocuments({
        $or: [
          { name: regex },
          { about: regex }
        ]
      })
    ]);
    await this.responseService.sendSuccess(searchLabelsPayload.token.userFields.channel, { businesses: labels, total });
  }


  async fetchAll(fetchLabelsPayload: FetchLabelsPayload): Promise<void> {
    const [categories, total] = await Promise.all([
      this.createdLabel.find({
        userId: fetchLabelsPayload.token.userFields.id
      }).limit(fetchLabelsPayload.limit).skip(fetchLabelsPayload.limit * (fetchLabelsPayload.page - 1)).exec(),
      this.createdLabel.countDocuments()
    ]);
    await this.responseService.sendSuccess(fetchLabelsPayload.token.userFields.channel, { categories, total });
  }

  async delete(deleteLabelPayload: DeleteLabelPayload): Promise<void> {
    const deleted = await this.createdLabel.deleteOne({
      _id: deleteLabelPayload._id,
      userId: deleteLabelPayload.token.userFields.id
    }).exec();
    await this.responseService.sendSuccess(deleteLabelPayload.token.userFields.channel, deleted);
  }

  async findById(findLabelPayload: FindLabelPayload): Promise<void> {
    const label = await this.createdLabel.find({
      _id: findLabelPayload._id,
      userId: findLabelPayload.token.userFields.id
    }).exec();
    await this.responseService.sendSuccess(findLabelPayload.token.userFields.channel, label);
  }

}
