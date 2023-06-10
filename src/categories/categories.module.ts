import { Module } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CategoriesController } from "./categories.controller";
import { ResponseService } from "../injection/response.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Category, CategorySchema } from "./entities/category.entity";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";

@Module({
  imports: [DatabaseConnectionModule, MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])],
  controllers: [CategoriesController],
  providers: [CategoriesService, ResponseService]
})
export class CategoriesModule {
}
