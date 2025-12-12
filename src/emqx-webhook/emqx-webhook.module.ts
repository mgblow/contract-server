import { Module } from '@nestjs/common';
import { EmqxWebhookController } from './emqx-webhook.controller';
import { EmqxWebhookService } from './emqx-webhook.service';
import { RequestService } from '../injection/request.service';

@Module({
  controllers: [EmqxWebhookController],
  providers: [EmqxWebhookService, RequestService],
  exports: [EmqxWebhookService],
})
export class EmqxWebhookModule {}
