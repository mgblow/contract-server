import { Test, TestingModule } from '@nestjs/testing';
import { GemsController } from './gems.controller';
import { GemsService } from './gems.service';

describe('GemsController', () => {
  let controller: GemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GemsController],
      providers: [GemsService],
    }).compile();

    controller = module.get<GemsController>(GemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
