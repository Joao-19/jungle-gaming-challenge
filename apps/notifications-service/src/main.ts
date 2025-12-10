import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  // 1. Cria a aplicação normal (HTTP) - Necessário para o WebSocket depois
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // 2. Conecta o Microserviço (RabbitMQ)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
      queue: 'notifications_queue', // Mesma fila que o TasksService envia
      queueOptions: {
        durable: false,
      },
    },
  });

  // 3. Inicia tudo
  await app.startAllMicroservices();
  await app.listen(3004); // Porta do Docker
  app.get(Logger).log('Notification Service is running on port 3004');
}
bootstrap();
