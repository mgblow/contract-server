import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateAvatarDto } from "./dto/update-avatar.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { Person } from "./entities/person.entity"; // Your Mongoose or TypeORM entity
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class PeopleService {
  constructor(@InjectModel(Person.name) private personModel: Model<Person>) {}


  async updateAvatar(updateAvatarDto: UpdateAvatarDto) {
    const person = await this.personModel.findById(updateAvatarDto._id);
    if (!person) throw new NotFoundException('Person not found');

    person.avatarConfig = { ...person.avatarConfig, ...updateAvatarDto };
    await person.save();
    return person;
  }

  async updateProfile(updateProfileDto: UpdateProfileDto) {
    const person = await this.personModel.findById(updateProfileDto._id);
    if (!person) throw new NotFoundException('Person not found');

    Object.assign(person, updateProfileDto);
    await person.save();
    return person;
  }
}
