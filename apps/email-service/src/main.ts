import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";

async function bootstrap() {
  // Para microserviços puros, criamos primeiro uma app HTTP temporária
  // para extrair o logger, depois descartamos
  const tempApp = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = tempApp.get(Logger);

  logger.log(
    `[EmailService] RabbitMQ URL: ${process.env.RABBITMQ_URL || "amqp://localhost:5672"}`
  );

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || "amqp://localhost:5672"],
        queue: "email_queue",
        queueOptions: {
          durable: true,
        },
      },
      bufferLogs: true,
    }
  );

  app.useLogger(logger);

  await tempApp.close(); // Fecha a app temporária

  await app.listen();
  logger.log(
    "[EmailService] Email Service is running and listening to RabbitMQ on queue: email_queue"
  );
  logger.log(
    `[EmailService] SMTP configured with host: ${process.env.SMTP_HOST || "Not set"}`
  );
}

bootstrap().catch((error) => {
  console.error("[EmailService] Failed to start Email Service:", error);
  process.exit(1);
});
