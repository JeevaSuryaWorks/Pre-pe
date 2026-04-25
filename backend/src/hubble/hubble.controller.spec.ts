import { Test, TestingModule } from '@nestjs/testing';
import { HubbleController } from './hubble.controller';

describe('HubbleController', () => {
  let controller: HubbleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HubbleController],
    }).compile();

    controller = module.get<HubbleController>(HubbleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
