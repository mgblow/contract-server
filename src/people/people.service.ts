import { Injectable } from "@nestjs/common";
import { UpdateAvatarDto } from "./dto/update-avatar.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { Person } from "./entities/person.entity";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { ResponseService } from "../injection/response.service";
import { MeiliSearchService } from "./meilisearch.service";
import { CreatePersonDto } from "./dto/create-person.dto";

@Injectable()
export class PeopleService {

  constructor(
    @InjectModel(Person.name) private personModel: Model<Person>,
    private readonly responseService: ResponseService,
    private readonly meiliService: MeiliSearchService, // MeiliSearch injection
  ) {}

  // --- Update Avatar ---
  async updatePersonAvatar(updateAvatarDto: UpdateAvatarDto) {
    const person = await this.personModel.findById(updateAvatarDto.token.userFields.id);
    if (!person) {
      return await this.responseService.sendError(
        updateAvatarDto.token.userFields.channel + "/updatePersonAvatar",
        { "avatar.user": "Person not found" }
      );
    }

    person.avatarConfig = {
      avatarStyle: updateAvatarDto.avatarStyle || person.avatarConfig?.avatarStyle,
      topType: updateAvatarDto.topType || person.avatarConfig?.topType,
      accessoriesType: updateAvatarDto.accessoriesType || person.avatarConfig?.accessoriesType,
      hairColor: updateAvatarDto.hairColor || person.avatarConfig?.hairColor,
      facialHairType: updateAvatarDto.facialHairType || person.avatarConfig?.facialHairType,
      facialHairColor: updateAvatarDto.facialHairColor || person.avatarConfig?.facialHairColor,
      clotheType: updateAvatarDto.clotheType || person.avatarConfig?.clotheType,
      clotheColor: updateAvatarDto.clotheColor || person.avatarConfig?.clotheColor,
      eyeType: updateAvatarDto.eyeType || person.avatarConfig?.eyeType,
      eyebrowType: updateAvatarDto.eyebrowType || person.avatarConfig?.eyebrowType,
      mouthType: updateAvatarDto.mouthType || person.avatarConfig?.mouthType,
      skinColor: updateAvatarDto.skinColor || person.avatarConfig?.skinColor,
    };    await person.save();
    await this.indexPerson(person);

    return this.responseService.sendSuccess(
      updateAvatarDto.token.userFields.channel + "/updatePersonAvatar",
      person
    );
  }

  // --- Update Profile ---
  async updatePersonProfile(updateProfileDto: UpdateProfileDto) {
    const person = await this.personModel.findById(updateProfileDto.token.userFields.id);
    if (!person) {
      return await this.responseService.sendError(
        updateProfileDto.token.userFields.channel + "/updatePersonProfile",
        { "profile.user": "Person not found" }
      );
    }
    // validate candidate username
    person.username = updateProfileDto.username;

    person.gender = updateProfileDto.gender;
    person.age = updateProfileDto.age;
    person.bio = updateProfileDto.bio;
    person.business = updateProfileDto.business;
    person.hobbies = updateProfileDto.hobbies;

    await person.save();
    await this.indexPerson(person);

    return this.responseService.sendSuccess(
      updateProfileDto.token.userFields.channel + "/updatePersonProfile",
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
  async createPerson(createPersonDto:CreatePersonDto) {
    // --- Check if person already exists by phone ---
    let person = await this.personModel.findOne({ phone: createPersonDto.phone });

    if (!person) {
      // --- Create new person if not found ---
      person = new this.personModel(createPersonDto);
      await person.save();
      await this.indexPerson(person);
    }

    // --- Return success with existing or newly created person ---
    return this.responseService.sendSuccess(
      createPersonDto.token.userFields.channel + "/createPerson",
      person
    );
  }


  // --- Delete Person ---
  async deletePerson(id: string, token: any) {
    await this.personModel.deleteOne({ _id: id });
    await this.meiliService.deletePerson(id);

    return this.responseService.sendSuccess(token.userFields.channel + "/deletePerson", { id });
  }
}
