import { Body, Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport'; // O guardião padrão do JWT
import { ApiOperation, ApiBody, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: 'Criar uma nova tarefa' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Corrigir Bug' },
        description: { type: 'string', example: 'Erro na tela de login' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'HIGH' },
        dueDate: { type: 'string', format: 'date-time' }
      }
    }
  })
  create(@Body() body: any, @Request() req: any) {
    const userId = req.user.userId;
    return this.tasksService.createTask(body, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({ summary: 'Listar todas as tarefas' })
  findAll() {
    return this.tasksService.findAll();
  }
}