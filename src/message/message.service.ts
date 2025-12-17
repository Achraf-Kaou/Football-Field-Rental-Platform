import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FindAllMessageDto } from './dto/find-all-message.dto';
import { Message } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    // Verify sender exists
    const sender = await this.prisma.user.findUnique({
      where: { id: createMessageDto.senderId },
    });

    if (!sender) {
      throw new NotFoundException(
        `Sender with ID ${createMessageDto.senderId} not found`,
      );
    }

    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: createMessageDto.receiverId },
    });

    if (!receiver) {
      throw new NotFoundException(
        `Receiver with ID ${createMessageDto.receiverId} not found`,
      );
    }

    // Cannot send message to yourself
    if (createMessageDto.senderId === createMessageDto.receiverId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    return this.prisma.message.create({
      data: {
        senderId: createMessageDto.senderId,
        receiverId: createMessageDto.receiverId,
        content: createMessageDto.content,
        status: createMessageDto.status || 'sent',
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAll(filters: FindAllMessageDto): Promise<Message[]> {
    const {
      page = 1,
      limit = 20,
      sortedBy = 'createdAt',
      sortedDirection = 'asc',
      senderId,
      receiverId,
      status,
    } = filters;

    return this.prisma.message.findMany({
      where: {
        ...(senderId && { senderId }),
        ...(receiverId && { receiverId }),
        ...(status && { status }),
      },
      orderBy: {
        [sortedBy]: sortedDirection,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findConversation(userId1: number, userId2: number): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async markAsRead(messageId: number, userId: number): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    if (message.receiverId !== userId) {
      throw new BadRequestException('You can only mark your own messages as read');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'read' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.message.count({
      where: {
        receiverId: userId,
        status: { in: ['sent', 'delivered'] },
      },
    });
  }
}
