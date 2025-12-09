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
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => AppService))
    private readonly appService: AppService,
  ) {}

  handleConnection(client: Socket) {
    // 1. Extract token from handshake auth or headers
    const token =
      client.handshake.auth.token || client.handshake.headers.authorization;

    if (!token) {
      console.log(`⚠️  Client ${client.id} tried to connect without token`);
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

      console.log('CONEXAO AUTHENTICADA', { userId });

      console.log(`🔌 WebSocket connection from origin: ${origin}`);
      console.log(
        `📋 CORS_ORIGIN expected: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`,
      );

      this.userSockets.set(userId, client.id);
      client.data.userId = userId; // Store for easy access in handlers
      console.log(`✅ Connected Client: ${client.id} (User: ${userId})`);
    } catch (error) {
      console.error(
        `❌ Client ${client.id} failed authentication:`,
        error.message,
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
      console.log(`Disconnected Client: ${client.id}`);
    }
  }

  notifyUser(userId: string, payload: any) {
    const socketId = this.userSockets.get(userId);

    if (socketId) {
      this.server.to(socketId).emit('notification', payload);
      console.log(`Notification sent via WebSocket to user ${userId}`);
    } else {
      console.log(`User ${userId} is not connected to WebSocket now.`);
    }
  }

  notifyUsers(userIds: string[], payload: any) {
    userIds.forEach((userId) => {
      this.notifyUser(userId, payload);
    });
  }

  @SubscribeMessage('mark_as_read_by_task')
  async handleMarkAsReadByTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      console.log('Ignore mark_as_read: No userId in socket');
      return;
    }

    if (!data.taskId) {
      console.log('Ignore mark_as_read: No taskId in payload');
      return;
    }

    console.log(
      `Received mark_as_read_by_task for Task: ${data.taskId} from User: ${userId}`,
    );
    await this.appService.markAsReadByTaskId(userId, data.taskId);
  }
}
