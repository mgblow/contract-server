import { Test, TestingModule } from '@nestjs/testing';
import { TexesService } from './texes.service';

describe('TexesService', () => {
  let service: TexesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TexesService],
    }).compile();

    service = module.get<TexesService>(TexesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
