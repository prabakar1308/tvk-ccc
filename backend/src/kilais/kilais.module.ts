import { Module } from '@nestjs/common';
import { KilaisController } from './kilais.controller';
import { KilaisService } from './kilais.service';

@Module({
  controllers: [KilaisController],
  providers: [KilaisService]
})
export class KilaisModule {}
