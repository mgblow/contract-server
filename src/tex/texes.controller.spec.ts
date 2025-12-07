import { Test, TestingModule } from "@nestjs/testing";
import { TexesController } from "./texes.controller";
import { TexesService } from "./texes.service";

describe("TexesController", () => {
  let controller: TexesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TexesController],
      providers: [TexesService]
    }).compile();

    controller = module.get<TexesController>(TexesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
