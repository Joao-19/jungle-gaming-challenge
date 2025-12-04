import { IsString, IsUUID, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsUUID()
  token: string;

  @ApiProperty({ example: "newPassword123!" })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @MaxLength(128, { message: "Password must not exceed 128 characters" })
  newPassword: string;
}
