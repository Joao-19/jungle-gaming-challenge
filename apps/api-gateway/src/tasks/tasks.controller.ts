import { Body, Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport'; // O guardião padrão do JWT

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(AuthGuard('jwt')) // 🔒 Só passa se tiver token válido
  @Post()
  create(@Body() body: any, @Request() req: any) {
    // O Passport decodificou o token e colocou o usuário dentro de req.user
    const userId = req.user.userId;

    return this.tasksService.createTask(body, userId);
  }

  // 👇 ADICIONE ESTA ROTA NOVA
  @UseGuards(AuthGuard('jwt')) // Protegido por Token também
  @Get()
  findAll() {
    return this.tasksService.findAll();
  }
}