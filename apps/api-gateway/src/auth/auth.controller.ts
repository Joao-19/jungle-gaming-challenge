import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import {
  CreateUserDto,
  LoginDto,
  LoginResponseDto,
  UserResponseDto,
  RefreshTokenDto,
} from '@repo/dtos';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @ApiOperation({ summary: 'Logout de usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'uuid-do-usuario' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
  })
  logout(@Body() body: { userId: string }): Promise<{ message: string }> {
    return this.authService.logout(body.userId);
  }

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
