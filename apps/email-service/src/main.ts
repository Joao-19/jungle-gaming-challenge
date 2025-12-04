import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";

async function bootstrap() {
  console.log(" [EmailService] Starting Email Service...");
  console.log(
    ` [EmailService] RabbitMQ URL: ${process.env.RABBITMQ_URL || "amqp://localhost:5672"}`
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
    }
  );

  await app.listen();
  console.log(
    "[EmailService] Email Service is running and listening to RabbitMQ on queue: email_queue"
  );
  console.log(
    `[EmailService] SMTP configured with host: ${process.env.SMTP_HOST || "Not set"}`
  );
}

bootstrap().catch((error) => {
  console.error("[EmailService] Failed to start Email Service:", error);
  process.exit(1);
});
