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
import { LoginResponseDto } from '@repo/dtos';

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
  logout(@Req() req: any) {
    return this.authService.logout(req.user['sub']);
  }

  // Endpoint protegido pela estratégia 'jwt-refresh' (Refresh Token)
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Req() req: any) {
    console.log('Auth log: ', req.user);

    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
