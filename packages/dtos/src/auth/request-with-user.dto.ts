import { IsString, IsNotEmpty, IsEmail, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Interface for Express Request with authenticated user from JWT
 * Used in controllers with @UseGuards(AuthGuard('jwt'))
 */
export interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    refreshToken?: string;
  };
}

/**
 * JWT Payload structure for type safety
 */
export class JwtPayloadDto {
  @ApiProperty({ description: "User ID (subject)" })
  @IsString()
  @IsNotEmpty()
  sub: string;

  @ApiProperty({ description: "User email" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: "Refresh token for token refresh flow" })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
