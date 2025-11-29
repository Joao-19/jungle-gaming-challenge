import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsGateway } from './notifications.gateway'; // Importe

@Controller()
export class AppController {
  constructor(private readonly notificationsGateway: NotificationsGateway) {} // Injete

  @EventPattern('task_created')
  handleTaskCreated(@Payload() data: any) {
    console.log('🔔 RabbitMQ recebeu:', data.title);

    // Envia para o WebSocket
    // O data.userId vem lá do TasksService que salvou no banco
    this.notificationsGateway.notifyUser(data.userId, {
      title: `Nova tarefa criada: ${data.title}`,
      taskId: data.id,
      type: 'TASK_CREATED'
    });
  }
}