import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FindAllMessageDto } from './dto/find-all-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';

@ApiTags('Messages')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }


  @Post('start-conversation')
  @ApiOperation({ summary: 'Start or check conversation with a user' })
  @ApiParam({ name: 'currentUserId', description: 'Current user ID' })
  @ApiParam({ name: 'targetUserId', description: 'Target user ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation info retrieved',
  })
  startConversation(@Body() dto: StartConversationDto) {
    return this.messageService.startConversation(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message (REST fallback)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Message successfully sent',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sender or Receiver not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot send message to yourself',
  })
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.create(createMessageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all messages with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of messages retrieved successfully',
  })
  findAll(@Query() filters: FindAllMessageDto) {
    return this.messageService.findAll(filters);
  }

  @Get('conversation/:userId1/:userId2')
  @ApiOperation({ summary: 'Get conversation between two users' })
  @ApiParam({ name: 'userId1', description: 'First user ID', type: Number })
  @ApiParam({ name: 'userId2', description: 'Second user ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation retrieved successfully',
  })
  findConversation(
    @Param('userId1', ParseIntPipe) userId1: number,
    @Param('userId2', ParseIntPipe) userId2: number,
  ) {
    return this.messageService.findConversation(userId1, userId2);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiParam({ name: 'id', description: 'Message ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message marked as read',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message not found',
  })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.messageService.markAsRead(id, userId);
  }

  @Get('unread/:userId')
  @ApiOperation({ summary: 'Get unread message count for a user' })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved successfully',
  })
  getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    return this.messageService.getUnreadCount(userId);
  }
}
