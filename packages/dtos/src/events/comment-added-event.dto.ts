import { IsString, IsNotEmpty, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

class CommentDataDto {
  @ApiProperty({ description: "Comment ID" })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: "Comment content" })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: "User ID who created the comment" })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class CommentAddedEventDto {
  @ApiProperty({ description: "Task title" })
  @IsString()
  @IsNotEmpty()
  taskTitle: string;

  @ApiProperty({ description: "Task ID" })
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({ description: "Array of recipient user IDs" })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({ description: "Comment data", type: CommentDataDto })
  @ValidateNested()
  @Type(() => CommentDataDto)
  comment: CommentDataDto;
}
