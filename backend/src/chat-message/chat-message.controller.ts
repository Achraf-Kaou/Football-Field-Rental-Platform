import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatMessageService } from './chat-message.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { LocalChatDto } from './dto/local-chat.dto';
import { ChatAnalyticsQueryDto } from './dto/chat-analytics-query.dto';
import { ChatHistoryQueryDto } from './dto/chat-history-query.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatMessageController {
  constructor(private readonly chatService: ChatMessageService) { }

  @Post('history')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a chat message' })
  @ApiResponse({
    status: 201,
    description: 'Message saved successfully',
  })
  async saveMessage(@Body() createChatMessageDto: CreateChatMessageDto) {
    return this.chatService.saveMessage(createChatMessageDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get chat history' })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved successfully',
  })
  async getChatHistory(@Query() query: ChatHistoryQueryDto) {
    return this.chatService.getChatHistory(query);
  }

  @Post('local')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get local chatbot response (fallback)' })
  @ApiResponse({
    status: 200,
    description: 'Local response generated',
  })
  async getLocalResponse(@Body() localChatDto: LocalChatDto) {
    const response = this.chatService.getLocalResponse(
      localChatDto.message,
      localChatDto.language || 'en',
    );

    return { response };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get chat analytics' })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
  })
  async getAnalytics(@Query() query: ChatAnalyticsQueryDto) {
    return this.chatService.getAnalytics(query);
  }
}