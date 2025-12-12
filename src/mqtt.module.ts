import { Module } from "@nestjs/common";
import { TopicsModule } from "./topics/topics.module";
import { TexesModule } from "./tex/texes.module";
import { PeopleModule } from "./people/people.module";
import { PicksModule } from "./picks/picks.module";
import { LynksModule } from './lynks/lynks.module';
import { GemsModule } from './gems/gems.module';
import { NotificationsModule } from './notifications/notifications.module';


@Module({
  imports: [
    TopicsModule,
    TexesModule,
    PeopleModule,
    PicksModule,
    LynksModule,
    GemsModule,
    NotificationsModule,
  ]
})
export class MqttModule {
}
