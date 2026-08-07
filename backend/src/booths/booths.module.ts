import { Module } from '@nestjs/common';
import { BoothsService } from './booths.service';
import { BoothsController } from './booths.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BoothsController],
  providers: [BoothsService],
})
export class BoothsModule {}
