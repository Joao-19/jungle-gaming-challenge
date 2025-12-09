import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '@repo/dtos';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(
    @Request() req: AuthenticatedRequest & { headers: any },
  ) {
    // Extract token from Authorization header to propagate to microservice
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('Authorization token is required');
    }

    return this.notificationsService.findAll(req.user.userId, token);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest & { headers: any },
  ) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('Authorization token is required');
    }

    return this.notificationsService.markAsRead(id, token);
  }
}
