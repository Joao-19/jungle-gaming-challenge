import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ThrottlerExceptionFilter } from './filters/throttler-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigin =
    configService.get<string>('CORS_ORIGIN') || 'http://localhost:5173';
  const port = configService.get<string>('PORT') || 3001;

  // SECURITY HEADERS
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Permite Swagger UI
          scriptSrc: ["'self'", "'unsafe-inline'"], // Permite Swagger UI
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Permite CORS funcionar
    }),
  );

  // CORS
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new ThrottlerExceptionFilter());
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
    `✅ Gateway running on port ${port} allowing CORS from: ${corsOrigin}`,
  );
  console.log(`🛡️  Security headers enabled (Helmet)`);
}
bootstrap();
