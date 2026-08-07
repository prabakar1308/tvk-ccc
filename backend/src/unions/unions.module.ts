import { Module } from '@nestjs/common';
import { UnionsService } from './unions.service';
import { UnionsController } from './unions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UnionsController],
  providers: [UnionsService],
})
export class UnionsModule {}
