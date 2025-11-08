import { Module } from "@nestjs/common";
import { TopicsModule } from "./topics/topics.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { LabelsModule } from "./labels/labelsModule";
import { PublishesModule } from "./publish/publishes.module";


@Module({
  imports: [
    TopicsModule,
    BusinessesModule,
    PublishesModule,
    LabelsModule,
  ]
})
export class MqttModule {
}
