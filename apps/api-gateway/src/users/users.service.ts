import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { UserQueryDto } from '@repo/dtos';

@Injectable()
export class UsersService {
  private authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:3002';
  }

  async findAll(query: UserQueryDto, token: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.authServiceUrl}/users`, {
          params: query,
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Erro no Auth Service',
        error.response?.status || 500,
      );
    }
  }
  async findOne(id: string, token?: string) {
    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const response = await lastValueFrom(
        this.httpService.get(`${this.authServiceUrl}/users/${id}`, config),
      );
      return response.data;
    } catch (error) {
      // Se não achar, retorna null para não quebrar o histórico se o usuário foi deletado
      return null;
    }
  }
}
