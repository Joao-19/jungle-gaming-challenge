import { Body, Controller, Post, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CreateUserDto,
  LoginDto,
  LoginResponseDto,
  UserResponseDto,
  RefreshTokenDto,
} from '@repo/dtos';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas por minuto
  @Post('login')
  @ApiOperation({ summary: 'Autenticação de usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'usuario@email.com' },
        password: { type: 'string', example: 'senha123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticação realizada com sucesso',
    type: LoginResponseDto,
  })
  login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(body);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registros por minuto
  @Post('register')
  @ApiOperation({ summary: 'Registro de usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'usuario@email.com' },
        password: { type: 'string', example: 'senha123' },
        username: { type: 'string', example: 'usuario' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso',
    type: UserResponseDto,
  })
  register(@Body() body: CreateUserDto): Promise<UserResponseDto> {
    return this.authService.register(body);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar Access Token' })
  // Padrão comum: Header Authorization Bearer <Refresh Token>
  @ApiResponse({
    status: 200,
    description: 'Access Token renovado com sucesso',
    type: LoginResponseDto,
  })
  refresh(@Body() body: RefreshTokenDto): Promise<LoginResponseDto> {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Logout de usuário' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
  })
  logout(@Headers('authorization') auth: string): Promise<{ message: string }> {
    const token = auth?.replace('Bearer ', '');
    // SECURITY: Forward the token to auth-service so it can validate and perform logout
    return this.authService.logout(token);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 solicitações por minuto
  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar reset de senha' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'usuario@email.com' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperação enviado (se o email existir)',
  })
  forgotPassword(
    @Body() body: { email: string },
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefinir senha com token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'uuid-token' },
        newPassword: { type: 'string', example: 'NovaSenha123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Senha redefinida com sucesso',
  })
  resetPassword(
    @Body() body: { token: string; newPassword: string },
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
