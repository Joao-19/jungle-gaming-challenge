import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Permite que o Frontend (porta 5173) conecte aqui
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Mapa simples para guardar qual usuário está em qual socket
  // Em produção, isso ficaria no Redis
  private userSockets = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    // O Frontend vai mandar o userId na query: ws://localhost:3004?userId=123
    const userId = client.handshake.query.userId as string;
    
    if (userId) {
      this.userSockets.set(userId, client.id);
      console.log(`Cliente conectado: ${client.id} (User: ${userId})`);
    }
  }

  handleDisconnect(client: Socket) {
    // Remove do mapa quando desconectar
    const userId = [...this.userSockets.entries()]
      .find(([_, socketId]) => socketId === client.id)?.[0];
      
    if (userId) {
      this.userSockets.delete(userId);
      console.log(`Cliente desconectado: ${client.id}`);
    }
  }

  // Método que será chamado quando chegar mensagem do RabbitMQ
  notifyUser(userId: string, payload: any) {
    const socketId = this.userSockets.get(userId);
    
    if (socketId) {
      // Envia APENAS para o socket deste usuário específico
      this.server.to(socketId).emit('notification', payload);
      console.log(`Mensagem enviada via WebSocket para o usuário ${userId}`);
    } else {
      console.log(`Usuário ${userId} não está conectado no WebSocket agora.`);
    }
  }
}