import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
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
      // 🔍 DEBUG: Log email length and content
      console.log('📧 [LOGIN DEBUG] Email received:', {
        email: body.email,
        emailLength: body.email.length,
        passwordLength: body.password.length,
        timestamp: new Date().toISOString(),
      });

      const response = await lastValueFrom(
        this.httpService.post<LoginResponseDto>(
          `${this.AUTH_SERVICE_URL}/auth/login`,
          body,
        ),
      );
      return response.data;
    } catch (error) {
      // 🔍 DEBUG: Log validation errors
      if (error.response?.status === 400) {
        console.error('❌ [LOGIN VALIDATION ERROR]:', {
          statusCode: error.response.status,
          message: error.response.data,
          timestamp: new Date().toISOString(),
        });
      }

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
      console.log(error);
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
      console.log(error);
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
      throw new HttpException(
        error.response?.data || 'Erro ao conectar no Auth Service',
        error.response?.status || 500,
      );
    }
  }
}
