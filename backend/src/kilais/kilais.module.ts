import { Module } from '@nestjs/common';
import { KilaisController } from './kilais.controller';
import { KilaisService } from './kilais.service';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [I18nModule],
  controllers: [KilaisController],
  providers: [KilaisService]
})
export class KilaisModule {}
