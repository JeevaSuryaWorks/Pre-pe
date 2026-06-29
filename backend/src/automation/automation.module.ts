import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { AutomationController } from './automation.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AutomationController],
    providers: [WhatsappService],
    exports: [WhatsappService]
})
export class AutomationModule {}
