import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingStatusScheduler } from './booking-status.scheduler';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingStatusScheduler],
})
export class BookingModule { }
