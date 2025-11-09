import { Test, TestingModule } from '@nestjs/testing';
import { PicksController } from './picks.controller';
import { PicksService } from './picks.service';

describe('PicksController', () => {
  let controller: PicksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PicksController],
      providers: [PicksService],
    }).compile();

    controller = module.get<PicksController>(PicksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
