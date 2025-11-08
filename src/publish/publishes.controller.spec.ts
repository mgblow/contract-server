import { Test, TestingModule } from "@nestjs/testing";
import { PublishesController } from "./publishes.controller";
import { PublishesService } from "./publishes.service";

describe("PublishesController", () => {
  let controller: PublishesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublishesController],
      providers: [PublishesService]
    }).compile();

    controller = module.get<PublishesController>(PublishesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
