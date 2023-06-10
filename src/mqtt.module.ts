import { Module } from "@nestjs/common";
import { CategoriesModule } from "./categories/categories.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { LabelsModule } from "./labels/labelsModule";
import { ContractsModule } from "./contracts/contracts.module";


@Module({
  imports: [
    CategoriesModule,
    BusinessesModule,
    ContractsModule,
    LabelsModule,
  ]
})
export class MqttModule {
}
