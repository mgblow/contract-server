import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ProxyModule } from "./proxy/proxy.module";
import { FilemanagerModule } from './filemanager/filemanager.module';

@Module({
  imports: [
    AuthModule,
    ProxyModule,
    FilemanagerModule
  ]
})
export class HttpModule {
}
