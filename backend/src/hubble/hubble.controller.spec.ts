import { Test, TestingModule } from '@nestjs/testing';
import { HubbleController } from './hubble.controller';
import { HubbleService } from './hubble.service';

describe('HubbleController', () => {
  let controller: HubbleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HubbleController],
      providers: [
        {
          provide: HubbleService,
          useValue: {
            getBrands: jest.fn(),
            getBrandDetails: jest.fn(),
            placeOrder: jest.fn(),
            getOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HubbleController>(HubbleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
