import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { PeopleService } from "./people.service";
import { UpdateAvatarDto } from "./dto/update-avatar.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CreatePersonDto } from "./dto/create-person.dto";

@Controller()
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  // --- Avatar ---
  @MessagePattern('updatePersonAvatar')
  updateAvatar(@Payload() payload: UpdateAvatarDto) {
    return this.peopleService.updatePersonAvatar(payload);
  }

  // --- Profile ---
  @MessagePattern('updatePersonProfile')
  updateProfile(@Payload() payload: UpdateProfileDto) {
    return this.peopleService.updatePersonProfile(payload);
  }

  // --- Search People ---
  @MessagePattern('searchPeople')
  searchPeople(@Payload() payload: { token: any; query: string; filters?: string; limit?: number; page?: number; sort?: string[] }) {
    const { token, query, filters, limit, page, sort } = payload;
    return this.peopleService.searchPeople(token, query, filters, limit, page, sort);
  }

  // --- Create Person ---
  @MessagePattern('createPerson')
  createPerson(@Payload() payload: CreatePersonDto) {
    return this.peopleService.createPerson(payload);
  }

  // --- Delete Person ---
  @MessagePattern('deletePerson')
  deletePerson(@Payload() payload: { id: string; token: any }) {
    const { id, token } = payload;
    return this.peopleService.deletePerson(id, token);
  }

  // --- Get Person ---
  @MessagePattern('getPerson')
  getPerson(@Payload() payload: { id: string; token: any }) {
    const { id, token } = payload;
    return this.peopleService.getPerson(id, token);
  }

  // --- Get Person ---
  @MessagePattern('getMe')
  getMe(@Payload() payload: { token: any }) {
    const { token } = payload;
    return this.peopleService.getMe(token);
  }
}
