import { Test, TestingModule } from '@nestjs/testing';
import { LynksController } from './lynks.controller';
import { LynksService } from './lynks.service';

describe('LynksController', () => {
  let controller: LynksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LynksController],
      providers: [LynksService],
    }).compile();

    controller = module.get<LynksController>(LynksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
