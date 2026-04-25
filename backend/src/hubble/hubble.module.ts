import { Module } from '@nestjs/common';
import { HubbleService } from './hubble.service';
import { HubbleController } from './hubble.controller';

@Module({
  providers: [HubbleService],
  controllers: [HubbleController]
})
export class HubbleModule {}
