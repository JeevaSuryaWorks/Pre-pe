import { Test, TestingModule } from '@nestjs/testing';
import { HubbleService } from './hubble.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HubbleService', () => {
  let service: HubbleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HubbleService,
        {
          provide: PrismaService,
          useValue: {
            profiles: { findUnique: jest.fn() },
            gift_card_vouchers: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<HubbleService>(HubbleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
