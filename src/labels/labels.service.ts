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
    @InjectModel(Label.name) private labelModel: Model<Label>,
    private readonly responseService: ResponseService
  ) {
  }

  async create(createlabelPayload: CreatelabelPayload): Promise<void> {
    const userLabelsCount = await this.labelModel.countDocuments({ 
      userId: createlabelPayload.token.userFields.id,
      boxId: createlabelPayload.boxId 
    });
    if (userLabelsCount == 1) {
      await this.responseService.sendError(createlabelPayload.token.userFields.channel, {
        "label.exists": "You have labeled this item."
      });
      return;
    }
    createlabelPayload.userId = createlabelPayload.token.userFields.id;
    const labelModel = new this.labelModel(createlabelPayload);
    const label = await labelModel.save();
    await this.responseService.sendSuccess(createlabelPayload.token.userFields.channel, label);
  }


  async searchByQuery(searchLabelsPayload: SearchLabelsPayload): Promise<void> {
    const regex = new RegExp(searchLabelsPayload.query, "i");
    const [labels, total] = await Promise.all([
      this.labelModel.find({
        $or: [
          { name: regex },
          { about: regex }
        ]
      }).limit(searchLabelsPayload.limit).skip(searchLabelsPayload.limit * (searchLabelsPayload.page - 1)).exec(),
      this.labelModel.countDocuments({
        $or: [
          { name: regex },
          { about: regex }
        ]
      })
    ]);
    await this.responseService.sendSuccess(searchLabelsPayload.token.userFields.channel, { businesses: labels, total });
  }


  async fetchAll(fetchLabelsPayload: FetchLabelsPayload): Promise<void> {
    const [labels, total] = await Promise.all([
      this.labelModel.find({
        userId: fetchLabelsPayload.token.userFields.id
      }).limit(fetchLabelsPayload.limit).skip(fetchLabelsPayload.limit * (fetchLabelsPayload.page - 1)).exec(),
      this.labelModel.countDocuments()
    ]);
    await this.responseService.sendSuccess(fetchLabelsPayload.token.userFields.channel, { categories: labels, total });
  }

  async delete(deleteLabelPayload: DeleteLabelPayload): Promise<void> {
    const deleted = await this.labelModel.deleteOne({
      _id: deleteLabelPayload._id,
      userId: deleteLabelPayload.token.userFields.id
    }).exec();
    await this.responseService.sendSuccess(deleteLabelPayload.token.userFields.channel, deleted);
  }

  async findById(findLabelPayload: FindLabelPayload): Promise<void> {
    const label = await this.labelModel.find({
      _id: findLabelPayload._id,
      userId: findLabelPayload.token.userFields.id
    }).exec();
    await this.responseService.sendSuccess(findLabelPayload.token.userFields.channel, label);
  }

}
