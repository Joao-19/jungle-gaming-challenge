import { IsEnum, IsNotEmpty, IsOptional, IsString, IsISO8601 } from 'class-validator';
import { TaskPriority } from '../entities/task.entity';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority) // Valida se é LOW, MEDIUM, HIGH ou URGENT
  @IsOptional()
  priority?: TaskPriority;

  @IsISO8601() // Valida se é uma data válida (ex: "2025-11-30")
  @IsOptional()
  dueDate?: string;

  // Nota: NÃO recebemos o userId aqui pelo body. 
  // O userId vem "invisível" pelo Token, por segurança.
}