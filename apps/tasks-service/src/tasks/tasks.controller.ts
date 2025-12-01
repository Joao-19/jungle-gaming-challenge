import { Controller, Post, Body, Get } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from '@repo/dtos';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() body: any) {
    // O Gateway vai mandar um JSON assim: { ...dadosDaTarefa, userId: "uuid" }
    // Então separamos o userId do resto dos dados
    const { userId, ...createTaskDto } = body;

    return this.tasksService.create(createTaskDto, userId);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }
}
