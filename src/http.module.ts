import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ProxyModule } from "./proxy/proxy.module";
import { FileModule } from './files/file.module';
import { LynksModule } from './lynks/lynks.module';

@Module({
  imports: [
    AuthModule,
    ProxyModule,
    FileModule,
    LynksModule,
  ]
})
export class HttpModule {
}
