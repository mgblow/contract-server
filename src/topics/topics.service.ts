import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateTopicPayload } from "./dto/create-topic.payload";
import { Topic } from "./entities/topic.entity";
import { UpdateTopicPayload } from "./dto/update-topic.payload";
import { ResponseService } from "../injection/response.service";
import { DeleteTopicPayload } from "./dto/delete-topic.payload";
import { FetchTopicsPayload } from "./dto/fetch-topics.payload";
import { FindTopicPayload } from "./dto/find-topic.payload";
import { SearchTopicsPayload } from "./dto/search-topics.payload";

@Injectable()
export class TopicsService {
  constructor(
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    private readonly responseService: ResponseService
  ) {
  }

  async create(createTopicDto: CreateTopicPayload): Promise<void> {
    // Check if topic name already exists
    const existingTopic = await this.topicModel.findOne({
      name: createTopicDto.name
    }).exec();
    if (existingTopic) {
      await this.responseService.sendError(createTopicDto.token.userFields.channel + "/createTopic", {
        "topic.name": "topic name already exists"
      });
    }
    // Check if topic name already exists
    if (createTopicDto.parent) {
      const existingParentTopic = await this.topicModel.findOne({
        _id: createTopicDto.parent
      }).exec();
      if (!existingParentTopic) {
        await this.responseService.sendError(createTopicDto.token.userFields.channel + "/createTopic", {
          "topic.parent": "topic parent _id does not exists"
        });
      }
    }
    // Create new topic and save to database
    const createdTopic = new this.topicModel(createTopicDto);
    const topic = await createdTopic.save();
    await this.responseService.sendSuccess(createTopicDto.token.userFields.channel + "/createTopic", topic);
  }

  async update(updateTopicDto: UpdateTopicPayload): Promise<void> {
    // Find the topic to update
    const existingTopic = await this.topicModel.findById(updateTopicDto._id).exec();
    if (!existingTopic) {
      await this.responseService.sendError(updateTopicDto.token.userFields.channel + "/updateTopic", {
        "topic._id": "topic _id does not exists"
      });
    }

    // Check if topic name already exists
    const existingTopicWithName = await this.topicModel.findOne({
      name: updateTopicDto.name,
      _id: { $ne: updateTopicDto._id }
    }).exec();
    if (existingTopicWithName) {
      await this.responseService.sendError(updateTopicDto.token.userFields.channel + "/updateTopic", {
        "topic.name": "topic name already exists"
      });
    }

    // Update the topic and save to database
    existingTopic.set(updateTopicDto);
    const updatedTopic = await existingTopic.save();
    await this.responseService.sendSuccess(updateTopicDto.token.userFields.channel + "/updateTopic", updatedTopic);
  }


  async searchByQuery(searchTopicsDto: SearchTopicsPayload): Promise<void> {
    // Create a regular expression to use in searching the database
    const regex = new RegExp(searchTopicsDto.query, "i");
    const topics = await this.topicModel
      .find({ $or: [{ name: regex }, { about: regex }] })
      .exec();
    await this.responseService.sendSuccess(searchTopicsDto.token.userFields.channel + "/searchTopics", topics);
  }

  async fetchAll(fetchTopicsDto: FetchTopicsPayload): Promise<void> {
    // Retrieve a paginated list of topics, along with the total count of topics
    const [topics, total] = await Promise.all([
      this.topicModel.find().limit(fetchTopicsDto.limit).skip(fetchTopicsDto.limit * (fetchTopicsDto.page - 1)).exec(),
      this.topicModel.countDocuments()
    ]);
    await this.responseService.sendSuccess(fetchTopicsDto.token.userFields.channel + "/fetchTopics", { topics, total });
  }

  async delete(deleteTopicDto: DeleteTopicPayload): Promise<void> {
    // Delete a topic with a specific ID
    const deleted = await this.topicModel.deleteOne({ _id: deleteTopicDto._id }).exec();
    await this.responseService.sendSuccess(deleteTopicDto.token.userFields.channel + "/deleteTopic", deleted);
  }

  async findById(findTopicDto: FindTopicPayload): Promise<void> {
    // Find a topic with a specific ID
    const topic = await this.topicModel.findById(findTopicDto._id).exec();
    await this.responseService.sendSuccess(findTopicDto.token.userFields.channel + "/findTopic", topic);
  }

}
