import { IsString, IsNotEmpty, IsOptional, IsArray } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TaskCreatedEventDto {
  @ApiProperty({ description: "Task ID" })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: "Task title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "User ID who created the task" })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ description: "Array of assignee user IDs" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assigneeIds?: string[];
}
