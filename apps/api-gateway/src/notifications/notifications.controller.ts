import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
  Headers,
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
    @Request() req: AuthenticatedRequest,
    @Headers('authorization') auth: string,
  ) {
    // Extract token from Authorization header
    const token = auth?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Authorization token is required');
    }

    return this.notificationsService.findAll(req.user.userId, token);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Headers('authorization') auth: string,
  ) {
    const token = auth?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Authorization token is required');
    }

    return this.notificationsService.markAsRead(id, token);
  }
}
