import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsGateway } from './notifications.gateway'; // Importe

@Controller()
export class AppController {
  constructor(private readonly notificationsGateway: NotificationsGateway) {} // Injete

  @EventPattern('task_created')
  handleTaskCreated(@Payload() data: any) {
    console.log('🔔 RabbitMQ recebeu (Created):', data.title);

    const recipients = [...new Set([data.userId, ...(data.assigneeIds || [])])];

    this.notificationsGateway.notifyUsers(recipients, {
      title: `Nova tarefa criada: ${data.title}`,
      taskId: data.id,
      type: 'TASK_CREATED',
    });
  }

  @EventPattern('task_updated')
  handleTaskUpdated(@Payload() data: any) {
    console.log('🔔 RabbitMQ recebeu (Updated):', data.title);

    // Verifica se houve mudança de Status ou Atribuição
    const changes = data.changes || [];
    const shouldNotify =
      changes.includes('STATUS') || changes.includes('ASSIGNEES');

    if (!shouldNotify) {
      console.log('🔕 Nenhuma mudança relevante para notificação.');
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
    console.log('Comment added:', data);
    // Emit to everyone in the task (owner + assignees)
    // We need to fetch the task to know assignees?
    // Or we can just broadcast to the room "task_{taskId}" if we had rooms.
    // For now, let's just emit 'task_activity' globally or to specific users if we had that info in 'data'.
    // 'data' is the Comment entity. It has 'userId' (author) and 'taskId'.
    // It does NOT have assigneeIds.
    // Ideally, TasksService should enrich the event payload with assigneeIds.
    // BUT, for the Chat component, we are listening to 'task_activity' on the frontend.
    // If we use `notifyUsers`, it sends to specific socket IDs.
    // If we want a "Chat Room", we should use rooms in Gateway.

    // Let's assume the frontend listens to "task_activity" and filters by taskId?
    // Or better: The Gateway joins the user to "task_{id}" room when they open the dialog.

    // For simplicity now: Broadcast to all connected clients and let frontend filter?
    // No, that's bad.

    // Let's emit a generic event that the frontend listens to.
    this.notificationsGateway.server.emit('task_activity', {
      type: 'COMMENT',
      ...data,
    });
  }
}
