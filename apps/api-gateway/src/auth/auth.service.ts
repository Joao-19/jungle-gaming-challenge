import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs'; // Helper para converter Observable em Promise

@Injectable()
export class AuthService {
  // A URL do serviço de Auth (no Docker seria http://auth-service:3002)
  // Por enquanto, rodando localmente, usamos localhost
  private AUTH_SERVICE_URL = 'http://localhost:3002/auth';

  constructor(private readonly httpService: HttpService) {}

  async login(body: any) {
    try {
      // Faz o POST para o Auth Service
      const response = await lastValueFrom(
        this.httpService.post(`${this.AUTH_SERVICE_URL}/login`, body)
      );
      return response.data; // Retorna o token para quem chamou
    } catch (error) {
      // Repassa o erro (401, 400, etc) original do Auth Service
      throw new HttpException(
        error.response?.data || 'Erro ao conectar no Auth Service',
        error.response?.status || 500,
      );
    }
  }
}