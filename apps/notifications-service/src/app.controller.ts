import { Controller, Get, Query, Patch, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import {
  TaskCreatedEventDto,
  TaskUpdatedEventDto,
  CommentAddedEventDto,
} from '@repo/dtos';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('task_created')
  async handleTaskCreated(@Payload() data: TaskCreatedEventDto) {
    const recipients = [...new Set([data.userId, ...(data.assigneeIds || [])])];

    // Persist and Notify for each recipient
    for (const userId of recipients) {
      await this.appService.create({
        userId,
        title: `Nova tarefa criada: ${data.title}`,
        type: 'TASK_CREATED',
        metadata: { taskId: data.id },
      });
    }
  }

  @EventPattern('task_updated')
  async handleTaskUpdated(@Payload() data: TaskUpdatedEventDto) {
    const changes = data.changes || [];
    const shouldNotify =
      changes.includes('STATUS') || changes.includes('ASSIGNEES');

    if (!shouldNotify) {
      return;
    }

    const recipients = [...new Set([data.userId, ...(data.assigneeIds || [])])];

    for (const userId of recipients) {
      await this.appService.create({
        userId,
        title: `Tarefa atualizada: ${data.title}`,
        type: 'TASK_UPDATED',
        content: `Alterações: ${changes.join(', ')}`,
        metadata: { taskId: data.id, changes },
      });
    }
  }

  @EventPattern('comment_added')
  async handleCommentAdded(@Payload() data: CommentAddedEventDto) {
    const { taskTitle, taskId, recipients } = data;
    if (!recipients || recipients.length === 0) {
      return;
    }

    for (const userId of recipients) {
      await this.appService.create({
        userId,
        title: `${taskTitle} tem um comentário!`,
        type: 'COMMENT_ADDED',
        metadata: { taskId },
      });
    }
  }

  // HTTP Endpoints exposed via Gateway (Hybrid Application)
  @Get('notifications')
  getNotifications(@Query('userId') userId: string) {
    return this.appService.findAll(userId);
  }

  @Patch('notifications/:id/read')
  markAsRead(@Param('id') id: string) {
    return this.appService.markAsRead(id);
  }
}
