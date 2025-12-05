import { IsEmail, IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PasswordResetEventDto {
  @ApiProperty({ description: "User email address" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "Password reset token" })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiPropertyOptional({ description: "User name" })
  @IsString()
  @IsOptional()
  username?: string;
}
