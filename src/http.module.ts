import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ProxyModule } from "./proxy/proxy.module";
import { FileModule } from './files/file.module';

@Module({
  imports: [
    AuthModule,
    ProxyModule,
    FileModule
  ]
})
export class HttpModule {
}
