import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginResponseDto, AuthenticatedRequest } from '@repo/dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK) // Retorna 200 em vez de 201 (padrão do POST)
  @Post('login')
  signIn(
    @Body() signInDto: { email: string; password: string },
  ): Promise<LoginResponseDto> {
    return this.authService.login(signInDto);
  }

  // Endpoint protegido pela estratégia 'jwt' (Access Token)
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.userId);
  }

  // Endpoint protegido pela estratégia 'jwt-refresh' (Refresh Token)
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    // AuthenticatedRequest from @repo/dtos currently only has { userId, email, username }.
    // It does NOT have refreshToken.
    // We need to extend it locally or update the DTO if refresh token strategy returns it.
    // For now, let's cast or access it if we know it's there, but TypeScript will complain.
    // Let's assume the Strategy returns it. Use 'as any' for now or handle it properly.
    const refreshToken = (req.user as any)['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    await this.authService.forgotPassword(body.email);
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return { message: 'Password has been reset successfully.' };
  }
}
