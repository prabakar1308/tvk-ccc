import { Module } from '@nestjs/common';
import { CadreService } from './cadre.service';
import { CadreController } from './cadre.controller';

@Module({
  providers: [CadreService],
  controllers: [CadreController]
})
export class CadreModule {}
