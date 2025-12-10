import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  constructor(
    @InjectPinoLogger(NotificationsGateway.name)
    private readonly logger: PinoLogger,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => AppService))
    private readonly appService: AppService,
  ) {}

  handleConnection(client: Socket) {
    // 1. Extract token from handshake auth or headers
    const token =
      client.handshake.auth.token || client.handshake.headers.authorization;

    if (!token) {
      this.logger.warn(`Client ${client.id} tried to connect without token`);
      client.disconnect();
      return;
    }

    try {
      // 2. Verify token
      // Removing 'Bearer ' if present
      const cleanToken = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(cleanToken, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload.sub;
      const origin = client.handshake.headers.origin;

      this.logger.info({ userId }, 'Authenticated WebSocket connection');
      this.logger.debug(
        {
          origin,
          expectedOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        },
        'WebSocket origin check',
      );

      this.userSockets.set(userId, client.id);
      client.data.userId = userId; // Store for easy access in handlers
      this.logger.info({ clientId: client.id, userId }, 'Client connected');
    } catch (error) {
      this.logger.error(
        { clientId: client.id, error: error.message },
        'Client authentication failed',
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.userSockets.entries()].find(
      ([_, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.userSockets.delete(userId);
      this.logger.info({ clientId: client.id, userId }, 'Client disconnected');
    }
  }

  notifyUser(userId: string, payload: any) {
    this.emitToUser(userId, 'notification', payload);
  }

  notifyUsers(userIds: string[], payload: any) {
    userIds.forEach((userId) => {
      this.notifyUser(userId, payload);
    });
  }

  emitToUser(userId: string, event: string, payload: any) {
    const socketId = this.userSockets.get(userId);

    if (socketId) {
      this.server.to(socketId).emit(event, payload);
      this.logger.info({ userId, event }, 'Event sent via WebSocket');
    } else {
      this.logger.debug({ userId, event }, 'User not connected to WebSocket');
    }
  }

  @SubscribeMessage('mark_as_read_by_task')
  async handleMarkAsReadByTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      this.logger.warn('Ignore mark_as_read: No userId in socket');
      return;
    }

    if (!data.taskId) {
      this.logger.warn('Ignore mark_as_read: No taskId in payload');
      return;
    }

    this.logger.info(
      { taskId: data.taskId, userId },
      'Received mark_as_read_by_task',
    );
    await this.appService.markAsReadByTaskId(userId, data.taskId);
  }
}
