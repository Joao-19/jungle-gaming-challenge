import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationsService {
  private readonly serviceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.serviceUrl =
      this.configService.get('NOTIFICATIONS_SERVICE_URL') ||
      'http://localhost:3004';
  }

  async findAll(userId: string, token?: string) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await firstValueFrom(
        this.httpService.get(`${this.serviceUrl}/notifications`, {
          params: { userId },
          headers,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch notifications',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async markAsRead(id: string, token?: string) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.serviceUrl}/notifications/${id}/read`,
          {},
          { headers },
        ),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to update notification',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
