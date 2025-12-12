import { Test, TestingModule } from '@nestjs/testing';
import { EmqxWebhookController } from './emqx-webhook.controller';

describe('EmqxWebhookController', () => {
  let controller: EmqxWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmqxWebhookController],
    }).compile();

    controller = module.get<EmqxWebhookController>(EmqxWebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
