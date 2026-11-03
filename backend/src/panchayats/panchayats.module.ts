import { Module } from '@nestjs/common';
import { PanchayatsService } from './panchayats.service';
import { PanchayatsController } from './panchayats.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PanchayatsController],
  providers: [PanchayatsService],
  exports: [PanchayatsService],
})
export class PanchayatsModule {}
