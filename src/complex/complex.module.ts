import { Module } from '@nestjs/common';
import { ComplexService } from './complex.service';
import { ComplexController } from './complex.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ComplexController],
  providers: [ComplexService],
})
export class ComplexModule {}
