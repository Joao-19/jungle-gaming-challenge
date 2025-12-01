import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "joaodev", description: "Unique username" })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: "joao@test.com", description: "Valid email" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "123456",
    description: "Strong password (minimum 6 characters)",
  })
  @IsString()
  @MinLength(6)
  password: string;
}
