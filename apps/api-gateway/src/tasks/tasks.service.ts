import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TasksService {
  // URL do microserviço de tasks (porta 3003)
  private SERVICE_URL = 'http://localhost:3003/tasks';

  constructor(private readonly httpService: HttpService) {}

  async createTask(data: any, userId: string) {
    try {
      // AQUI ESTÁ A MÁGICA: Injetamos o userId no corpo da requisição
      const payload = { ...data, userId }; 

      const response = await lastValueFrom(
        this.httpService.post(this.SERVICE_URL, payload)
      );
      return response.data;
    } catch (error) {
       throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }
}