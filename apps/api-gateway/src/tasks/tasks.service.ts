import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  private tasksServiceUrl: string;

  constructor(
    @InjectPinoLogger(TasksService.name)
    private readonly logger: PinoLogger,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.tasksServiceUrl =
      this.configService.get<string>('TASKS_SERVICE_URL') ||
      'http://localhost:3003';
  }
  async createTask(data: any, userId: string, token: string) {
    try {
      const payload = { ...data, userId };
      const response = await lastValueFrom(
        this.httpService.post(`${this.tasksServiceUrl}/tasks`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Create task failed');
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async findAll(filters: any, userId: string, token: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.tasksServiceUrl}/tasks`, {
          params: { ...filters, userId },
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Find all tasks failed');
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async findOne(id: string, token: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.tasksServiceUrl}/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        { error: error.message, taskId: id },
        'Find one task failed',
      );
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async update(id: string, data: any, userId: string, token: string) {
    try {
      const payload = { ...data, userId };

      this.logger.debug({ taskId: id, payload }, 'Updating task');
      const response = await lastValueFrom(
        this.httpService.patch(`${this.tasksServiceUrl}/tasks/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        { error: error.message, taskId: id },
        'Update task failed',
      );
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async remove(id: string, userId: string, token: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.delete(`${this.tasksServiceUrl}/tasks/${id}`, {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        { error: error.message, taskId: id },
        'Remove task failed',
      );
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async getHistory(id: string, filters: any, token: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.tasksServiceUrl}/tasks/${id}/history`, {
          params: filters,
          headers: { Authorization: `Bearer ${token}` },
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
      this.logger.error(
        { error: error.message, taskId: id },
        'Get history failed',
      );
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async addComment(id: string, userId: string, content: string, token: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          `${this.tasksServiceUrl}/tasks/${id}/comments`,
          { userId, content },
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        { error: error.message, taskId: id },
        'Add comment failed',
      );
      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }

  async getComments(id: string, filters: any, token: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.tasksServiceUrl}/tasks/${id}/comments`, {
          params: filters,
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      const comments = response.data.data; // Extract comments array from paginated response
      const enrichedComments = await Promise.all(
        comments.map(async (comment: any) => {
          const user = await this.usersService.findOne(comment.userId);
          return {
            ...comment,
            user: user ? { username: user.username } : null,
          };
        }),
      );

      return {
        ...response.data,
        data: enrichedComments,
      };
    } catch (error) {
      this.logger.error(
        { error: error.message, taskId: id },
        'Get comments failed',
      );

      throw new HttpException(
        error.response?.data || 'Erro no Tasks Service',
        error.response?.status || 500,
      );
    }
  }
}
