import { Test, TestingModule } from '@nestjs/testing';
import { EmqxWebhookService } from './emqx-webhook.service';

describe('EmqxWebhookService', () => {
  let service: EmqxWebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmqxWebhookService],
    }).compile();

    service = module.get<EmqxWebhookService>(EmqxWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
