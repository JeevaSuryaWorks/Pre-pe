import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('truecaller/callback')
    @HttpCode(HttpStatus.OK)
    async truecallerCallback(
        @Body() body: { requestId: string; accessToken: string; endpoint?: string }
    ) {
        return this.authService.handleTruecallerCallback(body.requestId, body.accessToken, body.endpoint || '');
    }

    @Get('truecaller/status')
    async checkTruecallerStatus(@Query('requestId') requestId: string) {
        const profile = this.authService.getTruecallerProfile(requestId);
        if (!profile) {
            return { status: 'PENDING' };
        }
        return { status: 'SUCCESS', profile };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: any) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body);
    }
}
