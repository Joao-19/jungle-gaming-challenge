import { IUser } from "./user.interface";

export class UserResponseDto {
  id: string;
  username: string;
  email: string;

  constructor(user: IUser) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
  }
}
