import { Body, Controller, Get, Post } from '@nestjs/common';
import { EmqxWebhookService } from './emqx-webhook.service';
import { EmqxWebhookBaseDto } from './dto/base.dto';

@Controller('emqx/webhook')
export class EmqxWebhookController {
  constructor(private readonly service: EmqxWebhookService) {}

  @Get()
  async handleHealth(){
    return { status: 200 };
  }

  @Post()
  async handleWebhook(@Body() body: EmqxWebhookBaseDto) {
    await this.service.handleEvent(body);
    return { status: 'ok' };
  }
}
