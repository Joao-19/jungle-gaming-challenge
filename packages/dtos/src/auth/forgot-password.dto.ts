import { IsEmail, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @MaxLength(254, { message: "Email must not exceed 254 characters" })
  @IsEmail()
  email: string;
}
