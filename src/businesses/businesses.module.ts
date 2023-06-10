import { Module } from "@nestjs/common";
import { BusinessesService } from "./businesses.service";
import { BusinessesController } from "./businesses.controller";
import { ResponseService } from "../injection/response.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Business, BusinessSchema } from "./entities/business.entity";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";

@Module({
  imports: [DatabaseConnectionModule, MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }])],
  controllers: [BusinessesController],
  providers: [BusinessesService, ResponseService]
})
export class BusinessesModule {
}
