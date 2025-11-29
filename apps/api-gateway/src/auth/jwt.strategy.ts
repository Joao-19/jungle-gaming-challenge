import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // O Nest roda isso se o token for válido
  async validate(payload: any) {
    // Retorna os dados que estarão disponíveis em "req.user"
    return { userId: payload.sub, email: payload.email, username: payload.username };
  }
}