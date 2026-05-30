import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ChatAnalyticsQueryDto } from './dto/chat-analytics-query.dto';
import { ChatHistoryQueryDto } from './dto/chat-history-query.dto';

@Injectable()
export class ChatMessageService {
    constructor(private prisma: PrismaService) { }

    /**
     * Save a chat message to the database
     */
    async saveMessage(createChatMessageDto: CreateChatMessageDto) {
        const message = await this.prisma.chatMessage.create({
            data: {
                userId: createChatMessageDto.userId || null,
                message: createChatMessageDto.message,
                response: createChatMessageDto.response || '',
                language: createChatMessageDto.language || 'en',
            },
        });

        return {
            success: true,
            messageId: message.id,
            message,
        };
    }

    /**
     * Get chat history with optional filtering
     */
    async getChatHistory(query: ChatHistoryQueryDto) {
        const { userId, limit = 50 } = query;

        const messages = await this.prisma.chatMessage.findMany({
            where: userId ? { userId } : undefined,
            orderBy: { timestamp: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        email: true,
                    },
                },
            },
        });

        return messages;
    }

    /**
     * Get a local response based on keywords (fallback when AI is unavailable)
     */
    getLocalResponse(message: string, language: string = 'en'): string {
        const lowerMessage = message.toLowerCase();

        const responses: { [key: string]: { [key: string]: string } } = {
            en: {
                'hello|hi|hey': 'Hello! How can I help you today?',
                'help': 'I can assist you with various questions. What would you like to know?',
                'book|booking|reserve': 'I can help you book a field. What sport are you interested in?',
                'price|cost|fee': 'Field prices vary by type and time. Would you like specific pricing information?',
                'location|address|where': 'We have multiple locations. Which area are you interested in?',
                'hours|open|close': 'Our facilities have varying hours. Which complex would you like to know about?',
                'bye|goodbye': 'Goodbye! Have a great day!',
                'thanks|thank you': "You're welcome! Is there anything else I can help with?",
                'default': 'I understand. Could you please provide more details?',
            },
            ar: {
                'مرحبا|أهلا|السلام': 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
                'مساعدة': 'يمكنني مساعدتك في أسئلة مختلفة. ماذا تريد أن تعرف؟',
                'حجز|احجز': 'يمكنني مساعدتك في حجز ملعب. ما هي الرياضة التي تهتم بها؟',
                'سعر|تكلفة': 'تختلف أسعار الملاعب حسب النوع والوقت. هل تريد معلومات تسعير محددة؟',
                'موقع|عنوان|أين': 'لدينا مواقع متعددة. ما هي المنطقة التي تهتم بها؟',
                'ساعات|افتح|اغلق': 'لدينا ساعات عمل متفاوتة. أي مجمع تريد أن تعرف عنه؟',
                'وداعا|مع السلامة': 'وداعاً! أتمنى لك يوماً سعيداً!',
                'شكرا|شكراً': 'على الرحب والسعة! هل هناك شيء آخر يمكنني المساعدة به؟',
                'default': 'أفهم. هل يمكنك تقديم المزيد من التفاصيل؟',
            },
            fr: {
                'bonjour|salut': 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
                'aide': 'Je peux vous aider avec diverses questions. Que voulez-vous savoir?',
                'réserver|réservation': 'Je peux vous aider à réserver un terrain. Quel sport vous intéresse?',
                'prix|coût': 'Les prix des terrains varient selon le type et l\'heure. Voulez-vous des informations spécifiques?',
                'au revoir': 'Au revoir! Passez une excellente journée!',
                'merci': 'De rien! Puis-je vous aider avec autre chose?',
                'default': 'Je comprends. Pourriez-vous fournir plus de détails?',
            },
        };

        const langResponses = responses[language] || responses['en'];

        for (const [keywords, response] of Object.entries(langResponses)) {
            if (keywords !== 'default') {
                const keywordList = keywords.split('|');
                if (keywordList.some((keyword) => lowerMessage.includes(keyword))) {
                    return response;
                }
            }
        }

        return langResponses['default'];
    }

    /**
     * Get chat analytics
     */
    async getAnalytics(query: ChatAnalyticsQueryDto) {
        const { userId, startDate, endDate } = query;

        // Build where clause
        const where: any = {};
        if (userId) where.userId = userId;
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = new Date(startDate);
            if (endDate) where.timestamp.lte = new Date(endDate);
        }

        // Get total messages
        const totalMessages = await this.prisma.chatMessage.count({ where });

        // Get unique users
        const uniqueUsers = await this.prisma.chatMessage.groupBy({
            by: ['userId'],
            where,
            _count: true,
        });

        // Get messages grouped by date
        const messagesByDate = await this.prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_messages,
        COUNT(DISTINCT user_id) as unique_users
      FROM ChatMessage
      WHERE ${userId ? `user_id = ${userId}` : '1=1'}
        ${startDate ? `AND timestamp >= ${new Date(startDate)}` : ''}
        ${endDate ? `AND timestamp <= ${new Date(endDate)}` : ''}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

        return {
            totalMessages,
            uniqueUsers: uniqueUsers.filter((u) => u.userId !== null).length,
            messagesByDate,
        };
    }

    /**
     * Delete old chat messages (cleanup)
     */
    async deleteOldMessages(daysOld: number = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.prisma.chatMessage.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });

        return {
            success: true,
            deletedCount: result.count,
        };
    }
}