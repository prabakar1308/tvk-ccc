import { Module } from '@nestjs/common';
import { WingsService } from './wings.service';
import { WingsController } from './wings.controller';

@Module({
  controllers: [WingsController],
  providers: [WingsService],
})
export class WingsModule {}
