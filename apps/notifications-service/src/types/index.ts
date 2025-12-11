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

/**
 * WebSocket notification payload
 * Generic payload for any notification type
 */
export type NotificationPayload = unknown;

/**
 * WebSocket event payload
 * Generic payload for WebSocket events
 */
export type EventPayload = unknown;
