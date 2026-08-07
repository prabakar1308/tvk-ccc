import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CadreLevel } from '@prisma/client';

@Injectable()
export class CadreService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: any) {
    return this.prisma.cadre.create({
      data: payload,
    });
  }

  findAll(query: any) {
    const { level, districtId, districtGroup, unionId, kilaiId, search } = query;
    const where: any = {};
    
    if (level) where.level = level;
    if (districtId) where.districtId = districtId;
    if (districtGroup) where.districtGroup = districtGroup;
    if (unionId) where.unionId = unionId;
    if (kilaiId) where.kilaiId = kilaiId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    return this.prisma.cadre.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const cadre = await this.prisma.cadre.findUnique({
      where: { id },
      include: {
        district: true,
        union: true,
        homeKilai: true,
        officeBearerRoles: true,
      },
    });
    if (!cadre) throw new NotFoundException('Cadre not found');
    return cadre;
  }

  async update(id: string, payload: any) {
    const cadre = await this.prisma.cadre.findUnique({ where: { id } });
    if (!cadre) throw new NotFoundException('Cadre not found');
    
    return this.prisma.cadre.update({
      where: { id },
      data: payload,
    });
  }

  async remove(id: string) {
    const cadre = await this.prisma.cadre.findUnique({ where: { id } });
    if (!cadre) throw new NotFoundException('Cadre not found');
    
    return this.prisma.cadre.delete({ where: { id } });
  }
}
