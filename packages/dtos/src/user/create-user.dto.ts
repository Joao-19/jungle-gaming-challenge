import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @MaxLength(50)
  @ApiProperty({ example: "joaodev", description: "Unique username" })
  @IsString()
  @IsNotEmpty()
  username: string;

  @MaxLength(254)
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
  @MaxLength(128)
  password: string;
}
