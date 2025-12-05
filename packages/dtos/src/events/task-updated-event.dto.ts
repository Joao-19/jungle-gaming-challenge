import { IsString, IsNotEmpty, IsOptional, IsArray } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TaskUpdatedEventDto {
  @ApiProperty({ description: "Task ID" })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: "Task title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "User ID who updated the task" })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ description: "Array of assignee user IDs" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assigneeIds?: string[];

  @ApiPropertyOptional({ description: "Array of changed fields" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  changes?: string[];
}
