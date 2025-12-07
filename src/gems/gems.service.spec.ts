import { Test, TestingModule } from '@nestjs/testing';
import { GemsService } from './gems.service';

describe('GemsService', () => {
  let service: GemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GemsService],
    }).compile();

    service = module.get<GemsService>(GemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
