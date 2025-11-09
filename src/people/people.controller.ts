import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Controller()
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @MessagePattern('createPerson')
  create(@Payload() createPersonDto: CreatePersonDto) {
    return this.peopleService.create(createPersonDto);
  }

  @MessagePattern('findAllPeople')
  findAll() {
    return this.peopleService.findAll();
  }

  @MessagePattern('findOnePerson')
  findOne(@Payload() id: number) {
    return this.peopleService.findOne(id);
  }

  @MessagePattern('updatePerson')
  update(@Payload() updatePersonDto: UpdatePersonDto) {
    return this.peopleService.update(updatePersonDto.id, updatePersonDto);
  }

  @MessagePattern('removePerson')
  remove(@Payload() id: number) {
    return this.peopleService.remove(id);
  }
}
