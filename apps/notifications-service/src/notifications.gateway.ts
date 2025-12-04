import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      this.userSockets.set(userId, client.id);
      console.log(`Connected Client: ${client.id} (User: ${userId})`);
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
}
