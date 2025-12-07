import { Module } from "@nestjs/common";
import { TopicsModule } from "./topics/topics.module";
import { TexesModule } from "./tex/texes.module";
import { PeopleModule } from "./people/people.module";
import { PicksModule } from "./picks/picks.module";


@Module({
  imports: [
    TopicsModule,
    TexesModule,
    PeopleModule,
    PicksModule
  ]
})
export class MqttModule {
}
