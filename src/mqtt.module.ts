import { Module } from "@nestjs/common";
import { TopicsModule } from "./topics/topics.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { LabelsModule } from "./labels/labelsModule";
import { PublishesModule } from "./publish/publishes.module";
import { PeopleModule } from "./people/people.module";


@Module({
  imports: [
    TopicsModule,
    BusinessesModule,
    PublishesModule,
    LabelsModule,
    PeopleModule,
  ]
})
export class MqttModule {
}
