import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { PeopleService } from "./people.service";
import { UpdateAvatarDto } from "./dto/update-avatar.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller()
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @MessagePattern('updatePersonAvatar')
  updateAvatar(@Payload() payload: UpdateAvatarDto) {
    return this.peopleService.updateAvatar(payload);
  }

  @MessagePattern('updatePersonProfile')
  updateProfile(@Payload() payload: UpdateProfileDto) {
    return this.peopleService.updateProfile(payload);
  }
}
