import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async login(loginDto: { email: string; password: string }) {
    // 1. Valida se a senha está certa usando o método que criamos no passo 1
    const user = await this.usersService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 2. Cria o "Payload" (os dados que vão escondidos dentro do token)
    const payload = { sub: user.id, username: user.username, email: user.email };

    // 3. Assina e retorna o token
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}