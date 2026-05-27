import { Module } from '@nestjs/common';
import { PayuService } from './payu.service';
import { PayuController } from './payu.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [PayuController],
  providers: [PayuService],
  exports: [PayuService],
})
export class PayuModule {}
