import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreatePublishPayload } from "./dto/create-publish.payload";
import { Publish } from "./entities/publish.entity";
import { UpdatePublishPayload } from "./dto/update-publish.payload";
import { ResponseService } from "../injection/response.service";
import { DeletePublishPayload } from "./dto/delete-publish.payload";
import { FetchPublishPayload } from "./dto/fetch-publish.payload";
import { FindPublishPayload } from "./dto/find-publish.payload";
import { SearchPublishesPayload } from "./dto/search-publishes.payload";
import { RequestService } from "../injection/request.service";

@Injectable()
export class PublishesService {
  constructor(
    @InjectModel(Publish.name) private publishModel: Model<Publish>,
    private readonly requestService: RequestService,
    private readonly responseService: ResponseService
  ) {
  }

  async create(createPublishPayload: CreatePublishPayload): Promise<void> {
    const findTopic = JSON.parse(await this.requestService.send("findTopic", {
      token: createPublishPayload.token,
      _id: createPublishPayload.topicId
    }));
    if (!findTopic.data.success) {
      await this.responseService.sendError(createPublishPayload.token.userFields.channel, {
        "topic._id": "topic _id does not exists"
      });
    }
    // fetch topic's options
    findTopic.data.body.options.forEach(option => {
      // options should be equal to topic's options
    });
    createPublishPayload.userId = createPublishPayload.token.userFields.id;
    const createdPublish = new this.publishModel(createPublishPayload);
    const publish = await createdPublish.save();
    await this.responseService.sendSuccess(createPublishPayload.token.userFields.channel + "/createPublish", publish);
  }


  async update(updatePublishPayload: UpdatePublishPayload): Promise<void> {
    const existingPublish = await this.publishModel.findById(updatePublishPayload._id).exec();
    if (!existingPublish) {
      await this.responseService.sendError(updatePublishPayload.token.userFields.channel, {
        "publish._id": "publish _id does not exists"
      });
    }
    existingPublish.set(updatePublishPayload);
    const updatedOption = await existingPublish.save();
    await this.responseService.sendSuccess(updatePublishPayload.token.userFields.channel + "/updatePublish", updatedOption);
  }


  async searchByQuery(searchPublishesPayload: SearchPublishesPayload): Promise<void> {
    const regex = new RegExp(searchPublishesPayload.query, "i");
    const [publishes, total] = await Promise.all([
      this.publishModel.find({
        $or: [
          { text: regex }
        ]
      }).limit(searchPublishesPayload.limit).skip(searchPublishesPayload.limit * (searchPublishesPayload.page - 1)).exec(),
      this.publishModel.countDocuments({
        $or: [
          { text: regex }
        ]
      })
    ]);
    Logger.log(`Found ${total} publishes matching query "${searchPublishesPayload.query}"`);
    await this.responseService.sendSuccess(searchPublishesPayload.token.userFields.channel + "/searchPublishes", {
      publishes: publishes,
      total: total
    });
  }


  async fetchAll(fetchPublishesPayload: FetchPublishPayload): Promise<void> {
    const [publishes, total] = await Promise.all([
      this.publishModel.find().limit(fetchPublishesPayload.limit).skip(fetchPublishesPayload.limit * (fetchPublishesPayload.page - 1)).exec(),
      this.publishModel.countDocuments()
    ]);
    await this.responseService.sendSuccess(fetchPublishesPayload.token.userFields.channel + "/fetchPublishes", {
      publishes: publishes,
      total
    });
  }

  async delete(deletePublishPayload: DeletePublishPayload): Promise<void> {
    const deleted = await this.publishModel.deleteOne({ _id: deletePublishPayload._id }).exec();
    await this.responseService.sendSuccess(deletePublishPayload.token.userFields.channel + "/deletePublish", deleted);
  }

  async findById(findPublishPayload: FindPublishPayload): Promise<void> {
    const update = await this.publishModel.findById(findPublishPayload._id).exec();
    await this.responseService.sendSuccess(findPublishPayload.token.userFields.channel + "/findPublish", update);
  }

}
