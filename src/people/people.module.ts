import { Module } from "@nestjs/common";
import { PeopleService } from "./people.service";
import { PeopleController } from "./people.controller";
import { ResponseService } from "../injection/response.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Person, PersonSchema } from "./entities/person.entity";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";

@Module({
  imports: [DatabaseConnectionModule, MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }])],
  controllers: [PeopleController],
  providers: [PeopleService, ResponseService]
})
export class PeopleModule {
}
