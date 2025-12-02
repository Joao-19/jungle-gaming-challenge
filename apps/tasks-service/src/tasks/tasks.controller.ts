import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { GetTasksFilterDto, UpdateTaskDto } from '@repo/dtos';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() body: any) {
    const { userId, ...createTaskDto } = body;
    return this.tasksService.create(createTaskDto, userId);
  }

  @Get()
  findAll(@Query() filters: GetTasksFilterDto) {
    return this.tasksService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateTaskDto & { userId: string },
  ) {
    const { userId, ...updateTaskDto } = body;
    return this.tasksService.update(id, updateTaskDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    return this.tasksService.remove(id, userId);
  }
}
