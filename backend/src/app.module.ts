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
import { DashboardModule } from './dashboard/dashboard.module';
import { StorageModule } from './storage/storage.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [AuthModule, PrismaModule, CadreModule, KilaisModule, UnionsModule, BoothsModule, DistrictModule, DashboardModule, StorageModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
