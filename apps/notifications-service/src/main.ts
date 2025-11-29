import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // 1. Cria a aplicação normal (HTTP) - Necessário para o WebSocket depois
  const app = await NestFactory.create(AppModule);

  // 2. Conecta o Microserviço (RabbitMQ)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:admin@localhost:5672'], // Credenciais do docker
      queue: 'notifications_queue', // Mesma fila que o TasksService envia
      queueOptions: {
        durable: false,
      },
    },
  });

  // 3. Inicia tudo
  await app.startAllMicroservices();
  await app.listen(3004); // Porta do Docker
  console.log('Notification Service is running on port 3004');
}
bootstrap();