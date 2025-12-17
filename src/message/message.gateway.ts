import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // En production, restreindre aux domaines autorisés
  },
  namespace: '/chat',
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<number, string> = new Map(); // userId -> socketId

  constructor(private readonly messageService: MessageService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove user from connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.connectedUsers.set(data.userId, client.id);
    console.log(`User ${data.userId} registered with socket ${client.id}`);
    return { event: 'registered', data: { userId: data.userId } };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Save message to database
      const message = await this.messageService.create(createMessageDto);

      // Send to sender (confirmation)
      client.emit('messageSent', message);

      // Send to receiver if online
      const receiverSocketId = this.connectedUsers.get(createMessageDto.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('newMessage', message);
        
        // Update status to delivered
        await this.messageService.markAsRead(message.id, createMessageDto.receiverId);
      }

      return { event: 'messageSent', data: message };
    } catch (error) {
      client.emit('error', { message: error.message });
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { messageId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.messageService.markAsRead(
        data.messageId,
        data.userId,
      );

      // Notify sender that message was read
      const senderSocketId = this.connectedUsers.get(message.senderId);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('messageRead', {
          messageId: message.id,
          readBy: data.userId,
        });
      }

      return { event: 'markedAsRead', data: message };
    } catch (error) {
      client.emit('error', { message: error.message });
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { userId: number; receiverId: number; isTyping: boolean },
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('userTyping', {
        userId: data.userId,
        isTyping: data.isTyping,
      });
    }
  }
}
