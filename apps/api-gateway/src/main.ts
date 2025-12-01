import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigin =
    configService.get<string>('CORS_ORIGIN') || 'http://localhost:5173';
  const port = configService.get<string>('PORT') || 3001;

  // CORS
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  //

  // SWAGGER
  const config = new DocumentBuilder()
    .setTitle('Task Manager')
    .setDescription('API Gateway para o sistema de gestão de tarefas')
    .setVersion('1.0')
    .addBearerAuth() // Habilita o cadeado para colocar o Token JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // A URL será /api/docs
  //

  await app.listen(port);
  console.log(
    `Gateway running on port ${port} allowing CORS from: ${corsOrigin}`,
  );
}
bootstrap();
