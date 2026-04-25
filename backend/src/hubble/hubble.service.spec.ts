import { Test, TestingModule } from '@nestjs/testing';
import { HubbleService } from './hubble.service';

describe('HubbleService', () => {
  let service: HubbleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HubbleService],
    }).compile();

    service = module.get<HubbleService>(HubbleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
