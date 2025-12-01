import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserResponseDto, LoginResponseDto } from '@repo/dtos';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(user: any): Promise<LoginResponseDto> {
    const findUserByEmail = await this.usersService.findOne({
      email: user.email,
    });
    if (!findUserByEmail) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(
      findUserByEmail.id,
      findUserByEmail.email,
    );
    await this.updateRefreshToken(findUserByEmail.id, tokens.refreshToken);
    return new LoginResponseDto(
      new UserResponseDto(findUserByEmail),
      tokens.accessToken,
      tokens.refreshToken,
    );
  }

  async logout(userId: string) {
    return this.usersService.update(userId, { currentRefreshToken: null });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findOne({ id: userId });
    if (!user || !user.currentRefreshToken)
      throw new ForbiddenException('Access Denied');

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.currentRefreshToken,
    );
    if (!tokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { currentRefreshToken: hash });
  }

  async getTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ||
            '15m') as any,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: (this.configService.get<string>(
            'JWT_REFRESH_EXPIRES_IN',
          ) || '7d') as any,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
