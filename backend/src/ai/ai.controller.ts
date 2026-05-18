import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat.dto';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @UseGuards(SupabaseAuthGuard)
    @Post('chat')
    async chat(@Req() req: any, @Body() body: ChatRequestDto) {
        return this.aiService.chat(body, req.user?.sub);
    }
}
