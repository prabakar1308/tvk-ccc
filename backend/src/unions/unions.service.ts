import { Injectable } from '@nestjs/common';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnionsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createUnionDto: CreateUnionDto) {
    return this.prisma.union.create({
      data: createUnionDto as any,
    });
  }

  findAll() {
    return this.prisma.union.findMany({
      include: { district: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const union = await this.prisma.union.findUnique({
      where: { id },
      include: {
        district: true,
        _count: {
          select: {
            kilais: true,
            cadres: true,
          },
        },
      },
    });

    if (!union) {
      return null;
    }

    const totalBooths = await this.prisma.booth.count({
      where: {
        kilais: {
          some: {
            unionId: id,
          },
        },
      },
    });

    const unionCadres = await this.prisma.cadre.findMany({
      where: {
        unionId: id,
        level: 'UNION',
      },
      include: {
        officeBearerRoles: true,
      },
    });

    const LEVEL_WEIGHTS: Record<string, number> = {
      DISTRICT: 1,
      GROUP: 2,
      UNION: 3,
      KILAI: 4,
    };

    const ROLE_WEIGHTS: Record<string, number> = {
      Secretary: 1,
      'Joint Secretary': 2,
      Treasurer: 3,
      'Deputy Secretary': 4,
      'Executive Committee Member': 5,
      'EC Member': 5,
    };

    unionCadres.sort((a, b) => {
      const levelA = LEVEL_WEIGHTS[a.level] || 99;
      const levelB = LEVEL_WEIGHTS[b.level] || 99;

      if (levelA !== levelB) {
        return levelA - levelB;
      }

      const roleA = ROLE_WEIGHTS[a.role || ''] || 99;
      const roleB = ROLE_WEIGHTS[b.role || ''] || 99;

      if (roleA !== roleB) {
        return roleA - roleB;
      }

      return 0;
    });

    return {
      ...union,
      totalBooths,
      unionCadres,
    };
  }

  update(id: string, updateUnionDto: UpdateUnionDto) {
    return this.prisma.union.update({
      where: { id },
      data: updateUnionDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.union.delete({ where: { id } });
  }
}
