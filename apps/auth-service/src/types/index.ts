import type { Request } from 'express';

/**
 * JWT payload structure from token
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  username: string;
}

/**
 * Request with refresh token
 */
export interface RefreshTokenRequest extends Request {
  user: JwtPayload & {
    refreshToken?: string;
  };
}

/**
 * User for login validation
 */
export interface LoginUser {
  id: string;
  email: string;
  password: string;
  username: string;
  refreshToken?: string | null;
}

/**
 * TypeORM FindOptionsWhere type helper
 */
export type WhereCondition<T> = Array<Partial<Record<keyof T, unknown>>>;
