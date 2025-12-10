import {
  Controller,
  Get,
  Query,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import {
  TaskCreatedEventDto,
  TaskUpdatedEventDto,
  CommentAddedEventDto,
} from '@repo/dtos';

/**
 * SECURITY: Defense in Depth - JWT Guards on HTTP endpoints ONLY
 *
 * This service has TWO types of entry points:
 * 1. HTTP endpoints (@Get, @Patch) - Called by API Gateway with JWT
 * 2. RabbitMQ EventPatterns - Async messages WITHOUT HTTP headers
 *
 * Guards are applied ONLY to individual HTTP methods, NOT at class level, because:
 * - EventPatterns don't have Authorization headers (RabbitMQ messages)
 * - Applying guard at class level would break all EventPattern handlers
 *
 * Defense in Depth: API Gateway validates JWT, we validate again on HTTP endpoints.
 */
@Controller()
export class AppController {
  constructor(
    @InjectPinoLogger(AppController.name)
    private readonly logger: PinoLogger,
    private readonly appService: AppService,
  ) {}

  @EventPattern('task_created')
  async handleTaskCreated(@Payload() data: TaskCreatedEventDto) {
    // Task Owner (data.userId) + Assignees
    const candidates = [data.userId, ...(data.assigneeIds || [])];
    const uniqueCandidates = [...new Set(candidates)];

    // Exclude Actor (who created the task)
    const recipients = uniqueCandidates.filter((id) => id !== data.actorId);

    for (const userId of recipients) {
      // 1. Send Notification (Persisted)
      await this.appService.create({
        userId,
        title: `Nova tarefa criada: ${data.title}`,
        type: 'TASK_CREATED',
        metadata: { taskId: data.id },
      });

      // 2. Send Real-time Event (Ephemeral for List Update)
      this.appService.emitEvent(userId, 'task:created', data);
    }
  }

  @EventPattern('task_updated')
  async handleTaskUpdated(@Payload() data: TaskUpdatedEventDto) {
    const changes = data.changes || [];
    const shouldNotify =
      changes.includes('STATUS') || changes.includes('ASSIGNEES');

    // Always emit update event for real-time list, even if no notification?
    // User requested: "update list". List should update on ANY update.
    // But recipients logic below depends on `shouldNotify` scope?
    // Actually, `shouldNotify` filters what is worth a *Notification*.
    // But for list update, maybe we want everything.
    // However, sticking to the current recipients logic is safe.

    // Recalculate recipients regardless of notification?
    const candidates = [data.userId, ...(data.assigneeIds || [])];
    const uniqueCandidates = [...new Set(candidates)];
    const recipients = uniqueCandidates.filter((id) => id !== data.actorId);

    // If just small update (title), maybe we should also emit?
    // Let's emit 'task:updated' to all associated users.

    for (const userId of recipients) {
      // Send Real-time Event FIRST (fast)
      this.appService.emitEvent(userId, 'task:updated', data);
    }

    if (!shouldNotify) {
      return;
    }

    // Send Notification
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
  @UseGuards(AuthGuard('jwt')) // JWT guard ONLY on HTTP endpoint
  getNotifications(@Query('userId') userId: string) {
    this.logger.debug({ userId }, 'Getting notifications');
    return this.appService.findAll(userId);
  }

  @Patch('notifications/:id/read')
  @UseGuards(AuthGuard('jwt')) // JWT guard ONLY on HTTP endpoint
  markAsRead(@Param('id') id: string) {
    return this.appService.markAsRead(id);
  }
}
