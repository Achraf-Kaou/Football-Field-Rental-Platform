import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BookingStatusScheduler {
    private readonly logger = new Logger(BookingStatusScheduler.name);

    constructor(private readonly prisma: PrismaService) { }

    // ✅ S'exécute chaque minute (modifiable selon vos besoins)
    @Cron(CronExpression.EVERY_MINUTE)
    async markCompletedBookings(): Promise<void> {
        const now = new Date();

        const result = await this.prisma.booking.updateMany({
            where: {
                endAt: { lt: now },
                status: { in: ['pending', 'confirmed'] },
            },
            data: { status: 'completed' },
        });

        if (result.count > 0) {
            this.logger.log(`Marked ${result.count} booking(s) as completed`);
        }
    }
}