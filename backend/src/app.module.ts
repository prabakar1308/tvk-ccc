import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CadreModule } from './cadre/cadre.module';
import { KilaisModule } from './kilais/kilais.module';
import { UnionsModule } from './unions/unions.module';
import { BoothsModule } from './booths/booths.module';
import { DistrictModule } from './district/district.module';

@Module({
  imports: [AuthModule, PrismaModule, CadreModule, KilaisModule, UnionsModule, BoothsModule, DistrictModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
