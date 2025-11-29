import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <--- Importe aqui
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    // 1. Carrega o .env globalmente para todo o Gateway
    ConfigModule.forRoot({
      isGlobal: true, // Isso faz o ConfigService funcionar em todos os módulos sem precisar importar de novo
    }),

    AuthModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}