import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsGateway } from './notifications.gateway'; // Importe

@Controller()
export class AppController {
  constructor(private readonly notificationsGateway: NotificationsGateway) {} // Injete

  @EventPattern('task_created')
  handleTaskCreated(@Payload() data: any) {
    const recipients = [...new Set([data.userId, ...(data.assigneeIds || [])])];

    this.notificationsGateway.notifyUsers(recipients, {
      title: `Nova tarefa criada: ${data.title}`,
      taskId: data.id,
      type: 'TASK_CREATED',
    });
  }

  @EventPattern('task_updated')
  handleTaskUpdated(@Payload() data: any) {
    const changes = data.changes || [];
    const shouldNotify =
      changes.includes('STATUS') || changes.includes('ASSIGNEES');

    if (!shouldNotify) {
      return;
    }

    const recipients = [...new Set([data.userId, ...(data.assigneeIds || [])])];

    this.notificationsGateway.notifyUsers(recipients, {
      title: `Tarefa atualizada: ${data.title}`,
      taskId: data.id,
      type: 'TASK_UPDATED',
      changes: changes,
    });
  }

  @EventPattern('comment_added')
  handleCommentAdded(@Payload() data: any) {
    const { comment, recipients } = data;

    if (!recipients || recipients.length === 0) {
      return;
    }

    this.notificationsGateway.notifyUsers(recipients, {
      type: 'COMMENT',
      ...comment,
    });
  }
}
