import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UserResponseDto, LoginResponseDto } from '@repo/dtos';

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.emailClient.connect();
    } catch (error) {
      console.error('Error connecting to EMAIL_SERVICE (RabbitMQ):', error);
      // Non-blocking error: allow service to start even if RabbitMQ is temporarily down.
      // ClientProxy will attempt to reconnect on request.
    }
  }

  async onModuleDestroy() {
    await this.emailClient.close();
  }

  async login(user: any): Promise<LoginResponseDto> {
    const validUser = await this.usersService.validateUser(
      user.email,
      user.password,
    );

    if (!validUser) {
      throw new ForbiddenException('Invalid email or password');
    }

    const tokens = await this.getTokens(validUser.id, validUser.email);
    await this.updateRefreshToken(validUser.id, tokens.refreshToken);

    return new LoginResponseDto(
      new UserResponseDto(validUser),
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

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOne({ email });

    if (!user) {
      return;
    }

    const resetToken = randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    try {
      const updateResult = await this.usersService.update(user.id, {
        resetToken,
        resetTokenExpiry,
      });

      this.emailClient.emit('password_reset_requested', {
        email: user.email,
        resetToken,
        username: user.username,
      });
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findOne({ resetToken: token });

    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });
  }
}
