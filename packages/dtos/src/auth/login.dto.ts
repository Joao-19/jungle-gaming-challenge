import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "test@test.com", description: "User email" })
  @IsNotEmpty()
  @MaxLength(254, { message: "Email must not exceed 254 characters" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "123456", description: "User password" })
  @IsNotEmpty()
  @MaxLength(128, { message: "Password must not exceed 128 characters" })
  @IsString()
  password: string;
}
