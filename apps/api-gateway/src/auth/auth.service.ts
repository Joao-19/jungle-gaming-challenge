import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

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

  async login(body: any) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.AUTH_SERVICE_URL}/auth/login`, body),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Erro ao conectar no Auth Service',
        error.response?.status || 500,
      );
    }
  }

  async register(body: any) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.AUTH_SERVICE_URL}/users`, body),
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
