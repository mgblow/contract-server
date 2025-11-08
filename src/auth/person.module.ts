// person.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Person, PersonSchema } from "./entities/person.entity";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }])
  ],
  exports: [
    MongooseModule // export it so other modules can inject the model
  ]
})
export class PersonModule {}
