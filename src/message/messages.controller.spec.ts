import { Test, TestingModule } from "@nestjs/testing";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";

describe("TopicsController", () => {
  let controller: MessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [MessagesService]
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
