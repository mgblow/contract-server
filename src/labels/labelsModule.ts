import { Module } from "@nestjs/common";
import { LabelsService } from "./labels.service";
import { LabelsController } from "./labels.controller";
import { ResponseService } from "../injection/response.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Label, LabelSchema } from "./entities/label.entity";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";

@Module({
  imports: [DatabaseConnectionModule, MongooseModule.forFeature([{ name: Label.name, schema: LabelSchema }])],
  controllers: [LabelsController],
  providers: [LabelsService, ResponseService]
})
export class LabelsModule {
}
