import { Injectable } from "@nestjs/common";
import { UpdateAvatarDto } from "./dto/update-avatar.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { Person } from "./entities/person.entity";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { ResponseService } from "../injection/response.service";
import { MeiliSearchService } from "./meilisearch.service";

@Injectable()
export class PeopleService {

  constructor(
    @InjectModel(Person.name) private personModel: Model<Person>,
    private readonly responseService: ResponseService,
    private readonly meiliService: MeiliSearchService, // MeiliSearch injection
  ) {}

  // --- Update Avatar ---
  async updateAvatar(updateAvatarDto: UpdateAvatarDto) {
    const person = await this.personModel.findById(updateAvatarDto._id);
    if (!person) {
      return await this.responseService.sendError(
        updateAvatarDto.token.userFields.channel + "/updateAvatar",
        { "avatar.user": "Person not found" }
      );
    }

    person.avatarConfig = { ...person.avatarConfig, ...updateAvatarDto };
    await person.save();
    await this.indexPerson(person);

    return this.responseService.sendSuccess(
      updateAvatarDto.token.userFields.channel + "/updateAvatar",
      person
    );
  }

  // --- Update Profile ---
  async updateProfile(updateProfileDto: UpdateProfileDto) {
    const person = await this.personModel.findById(updateProfileDto._id);
    if (!person) {
      return await this.responseService.sendError(
        updateProfileDto.token.userFields.channel + "/updateProfile",
        { "profile.user": "Person not found" }
      );
    }

    Object.assign(person, updateProfileDto);
    await person.save();
    await this.indexPerson(person);

    return this.responseService.sendSuccess(
      updateProfileDto.token.userFields.channel + "/updateProfile",
      person
    );
  }

  // --- Index person to MeiliSearch ---
  private async indexPerson(person: Person) {
    await this.meiliService.addOrUpdatePerson({
      id: person._id.toString(),
      username: person.username,
      gender: person.gender,
      age: person.age,
      location: person.location,
      hobbies: person.hobbies.map(h => h.toString()),
      businessTypes: person.business,
      avatarStyle: person.avatarConfig?.style,
      topType: person.avatarConfig?.topType,
      accessories: person.avatarConfig?.accessories,
      hairColor: person.avatarConfig?.hairColor,
      eyeType: person.avatarConfig?.eyeType,
      skinColor: person.avatarConfig?.skinColor,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      popularityScore: person.popularityScore || 0,
    });
  }

  // --- Search People ---
  async searchPeople(
    token: any,
    query: string,
    filters?: string,
    limit = 20,
    page = 1,
    sort?: string[]
  ) {
    const offset = (page - 1) * limit;

    const result = await this.meiliService.searchPeople(query, filters, limit, offset, sort);

    return this.responseService.sendSuccess(
      token.userFields.channel + "/searchPeople",
      result
    );
  }

  // --- Create Person ---
  async createPerson(personData: Partial<Person>, token: any) {
    const person = new this.personModel(personData);
    await person.save();
    await this.indexPerson(person);

    return this.responseService.sendSuccess(token.userFields.channel + "/createPerson", person);
  }

  // --- Delete Person ---
  async deletePerson(id: string, token: any) {
    await this.personModel.deleteOne({ _id: id });
    await this.meiliService.deletePerson(id);

    return this.responseService.sendSuccess(token.userFields.channel + "/deletePerson", { id });
  }
}
