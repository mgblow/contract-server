import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { FileModule } from './files/file.module';
import { EmqxWebhookModule } from './emqx-webhook/emqx-webhook.module';

@Module({
  imports: [AuthModule, ProxyModule, FileModule, EmqxWebhookModule],
})
export class HttpModule {}
