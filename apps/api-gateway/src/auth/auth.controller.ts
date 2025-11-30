import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

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
  login(@Body() body: any) {
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
  register(@Body() body: any) {
    return this.authService.register(body);
  }
}
