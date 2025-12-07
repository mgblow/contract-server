import { Test, TestingModule } from '@nestjs/testing';
import { LynksService } from './lynks.service';

describe('LynksService', () => {
  let service: LynksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LynksService],
    }).compile();

    service = module.get<LynksService>(LynksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
