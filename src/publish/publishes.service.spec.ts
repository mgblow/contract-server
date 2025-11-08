import { Test, TestingModule } from '@nestjs/testing';
import { PublishesService } from './publishes.service';

describe('PublishesService', () => {
  let service: PublishesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublishesService],
    }).compile();

    service = module.get<PublishesService>(PublishesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
