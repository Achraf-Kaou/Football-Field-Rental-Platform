import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplexModule } from './complex/complex.module';
import { FieldModule } from './field/field.module';
import { BookingModule } from './booking/booking.module';
import { MessageModule } from './message/message.module';
import { ChatMessageModule } from './chat-message/chat-message.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ComplexModule,
    FieldModule,
    BookingModule,
    MessageModule,
    ChatMessageModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
