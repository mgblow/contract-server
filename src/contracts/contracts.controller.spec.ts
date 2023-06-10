import { Test, TestingModule } from "@nestjs/testing";
import { ContractsController } from "./contracts.controller";
import { ContractsService } from "./contracts.service";

describe("CategoriesController", () => {
  let controller: ContractsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [ContractsService]
    }).compile();

    controller = module.get<ContractsController>(ContractsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
