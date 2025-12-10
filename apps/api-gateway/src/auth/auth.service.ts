import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import {
  CreateUserDto,
  LoginDto,
  LoginResponseDto,
  UserResponseDto,
} from '@repo/dtos';

@Injectable()
export class AuthService {
  private AUTH_SERVICE_URL: string;

  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.AUTH_SERVICE_URL =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:3002';
  }

  // in a complete project is interesting to type an error and succes response, pessoal recomendation, Result.ts lib, is a good choice

  async login(body: LoginDto): Promise<LoginResponseDto> {
    try {
      const response = await lastValueFrom(
        this.httpService.post<LoginResponseDto>(
          `${this.AUTH_SERVICE_URL}/auth/login`,
          body,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Login failed');
      throw new HttpException(
        error.response?.data || 'Erro ao conectar no Auth Service',
        error.response?.status || 500,
      );
    }
  }

  async register(body: CreateUserDto): Promise<UserResponseDto> {
    try {
      const response = await lastValueFrom(
        this.httpService.post<UserResponseDto>(
          `${this.AUTH_SERVICE_URL}/users`,
          body,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Registration failed');
      throw new HttpException(
        error.response?.data || 'Erro ao conectar no Auth Service',
        error.response?.status || 500,
      );
    }
  }

  async refresh(refreshToken: string) {
    try {
      const url = `${this.AUTH_SERVICE_URL}/auth/refresh`;
      // Passar o token no header Authorization
      const response = await lastValueFrom(
        this.httpService.post(
          url,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Token refresh failed');
      throw new HttpException(
        error.response?.data || 'Erro ao conectar no Auth Service',
        error.response?.status || 500,
      );
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.AUTH_SERVICE_URL}/auth/logout`, {
          userId,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error({ error: error.message, userId }, 'Logout failed');
      throw new HttpException(
        error.response?.data || 'Erro ao conectar no Auth Service',
        error.response?.status || 500,
      );
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.AUTH_SERVICE_URL}/auth/forgot-password`, {
          email,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Forgot password failed');
      throw new HttpException(
        error.response?.data || 'Erro ao conectar no Auth Service',
        error.response?.status || 500,
      );
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.AUTH_SERVICE_URL}/auth/reset-password`, {
          token,
          newPassword,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Reset password failed');
      throw new HttpException(
        error.response?.data || 'Erro ao conectar no Auth Service',
        error.response?.status || 500,
      );
    }
  }
}
