import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto } from '@repo/dtos';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: 'Criar uma nova tarefa' })
  @ApiResponse({
    status: 201,
    description: 'Tarefa criada com sucesso.',
    type: TaskResponseDto,
  })
  create(@Body() body: CreateTaskDto, @Request() req: any) {
    const userId = req.user.userId;
    return this.tasksService.createTask(body, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({ summary: 'Listar todas as tarefas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tarefas.',
    type: [TaskResponseDto],
  })
  findAll() {
    return this.tasksService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma tarefa pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da tarefa.',
    type: TaskResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma tarefa' })
  @ApiResponse({
    status: 200,
    description: 'Tarefa atualizada.',
    type: TaskResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.tasksService.update(id, body, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma tarefa' })
  @ApiResponse({
    status: 200,
    description: 'Tarefa removida.',
  })
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;
    return this.tasksService.remove(id, userId);
  }
}
