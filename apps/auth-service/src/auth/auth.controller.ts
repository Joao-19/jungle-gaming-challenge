import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK) // Retorna 200 em vez de 201 (padrão do POST)
  @Post('login')
  signIn(@Body() signInDto: { email: string; password: string }) {
    return this.authService.login(signInDto);
  }
}