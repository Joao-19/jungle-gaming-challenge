import { UserResponseDto } from "../user/user-response.dto";

export class LoginResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;

  constructor(
    user: UserResponseDto,
    accessToken: string,
    refreshToken: string
  ) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
