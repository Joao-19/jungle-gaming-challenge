import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LogoutDto {
  @ApiProperty({ example: "uuid", description: "User id" })
  @IsNotEmpty()
  @MaxLength(40, { message: "User id must not exceed 40 characters" })
  @IsString()
  userId: string;

  @ApiProperty({ example: "uuid", description: "User token" })
  @IsNotEmpty()
  @MaxLength(256, { message: "User token must not exceed 256 characters" })
  @IsString()
  token: string;
}
