import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  private tasksServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.tasksServiceUrl =
      this.configService.get<string>('TASKS_SERVICE_URL') ||
      'http://localhost:3003';
  }
  async createTask(data: any, userId: string) {
    try {
      const payload = { ...data, userId };

      const response = await lastValueFrom(
        this.httpService.post(`${this.tasksServiceUrl}/tasks`, payload),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async findAll(filters: any) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.tasksServiceUrl}/tasks`, {
          params: filters,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async findOne(id: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.tasksServiceUrl}/tasks/${id}`),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async update(id: string, data: any, userId: string) {
    try {
      const payload = { ...data, userId };
      const response = await lastValueFrom(
        this.httpService.patch(`${this.tasksServiceUrl}/tasks/${id}`, payload),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async remove(id: string, userId: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.delete(`${this.tasksServiceUrl}/tasks/${id}`, {
          params: { userId },
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async getHistory(id: string, filters: any) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.tasksServiceUrl}/tasks/${id}/history`, {
          params: filters,
        }),
      );

      const history = response.data.data;
      const enrichedHistory = await Promise.all(
        history.map(async (item: any) => {
          const user = await this.usersService.findOne(item.userId);
          return {
            ...item,
            user: user ? { username: user.username } : null,
          };
        }),
      );

      return {
        ...response.data,
        data: enrichedHistory,
      };
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async addComment(id: string, userId: string, content: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.tasksServiceUrl}/tasks/${id}/comments`, {
          userId,
          content,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async getComments(id: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.tasksServiceUrl}/tasks/${id}/comments`),
      );

      const comments = response.data;
      const enrichedComments = await Promise.all(
        comments.map(async (comment: any) => {
          const user = await this.usersService.findOne(comment.userId);
          return {
            ...comment,
            user: user ? { username: user.username } : null,
          };
        }),
      );

      return enrichedComments;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }
}
