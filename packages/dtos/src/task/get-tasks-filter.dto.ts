import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsISO8601,
} from "class-validator";
import { Type } from "class-transformer";
import { TaskPriority, TaskStatus } from "./enums";

export class GetTasksFilterDto {
  @ApiPropertyOptional({ description: "Filter by title (partial match)" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: TaskStatus, description: "Filter by status" })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: "Filter by priority",
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: "Filter by assignee ID" })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ description: "Filter by due date (ISO string)" })
  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @ApiPropertyOptional({ description: "Page number (default: 1)", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page (default: 10)",
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
