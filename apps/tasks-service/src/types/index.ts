/**
 * JWT payload structure from token
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  username?: string;
}

/**
 * Request with user authentication
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  username?: string;
}
