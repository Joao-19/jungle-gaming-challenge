import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config'; // <--- Importe o ConfigService

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || 'http://localhost:5173';
  const port = configService.get<string>('PORT') || 3001;

  app.enableCors({
    origin: corsOrigin, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(port);
  console.log(`Gateway running on port ${port} allowing CORS from: ${corsOrigin}`);
}
bootstrap();