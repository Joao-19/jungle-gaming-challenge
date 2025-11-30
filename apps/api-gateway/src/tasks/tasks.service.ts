import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TasksService {
  // URL do microserviço de tasks (porta 3003)
  private tasksServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    // Pega TASKS_tasksServiceUrl do ambiente
    this.tasksServiceUrl = this.configService.get<string>('TASKS_SERVICE_URL') || 'http://localhost:3003';
  }
  async createTask(data: any, userId: string) {
    try {
      // AQUI ESTÁ A MÁGICA: Injetamos o userId no corpo da requisição
      const payload = { ...data, userId }; 

      const response = await lastValueFrom(
        this.httpService.post(this.tasksServiceUrl, payload)
      );
      return response.data;
    } catch (error) {
       throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async findAll() {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.tasksServiceUrl}/tasks`)
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