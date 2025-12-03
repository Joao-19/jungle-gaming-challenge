import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TaskHistory } from './entities/task-history.entity';
import { TaskComment } from './entities/task-comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskHistory, TaskComment]),
    // Registra o cliente que vai mandar mensagens
    ClientsModule.register([
      {
        name: 'NOTIFICATIONS_SERVICE', // O nome que usaremos para injetar no Service
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
          ], // Credenciais do docker-compose
          queue: 'notifications_queue', // Nome da fila onde as mensagens vão cair
          queueOptions: {
            durable: false, // Em produção seria true, para teste false é mais rápido
          },
        },
      },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
