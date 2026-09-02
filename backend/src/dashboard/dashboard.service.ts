import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUnions,
      totalKilais,
      totalCadres,
      totalBooths
    ] = await Promise.all([
      this.prisma.union.count(),
      this.prisma.kilai.count(),
      this.prisma.cadre.count(),
      this.prisma.booth.count(),
    ]);

    return {
      totalUnions,
      totalKilais,
      totalCadres,
      totalBooths,
    };
  }
}
