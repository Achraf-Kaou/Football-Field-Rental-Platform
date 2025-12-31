import { Module } from '@nestjs/common';
import { ComplexService } from './complex.service';
import { ComplexController } from './complex.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [ComplexController],
  providers: [ComplexService],
})
export class ComplexModule { }
