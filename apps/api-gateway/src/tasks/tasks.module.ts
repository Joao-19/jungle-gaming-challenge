import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { HttpModule } from '@nestjs/axios';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [HttpModule, UsersModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
