import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignWingMemberDto } from './dto/assign-wing-member.dto';
import { CadreLevel } from '@prisma/client';

@Injectable()
export class WingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(level?: CadreLevel, districtId?: string, unionId?: string) {
    return this.prisma.wing.findMany({
      orderBy: { order: 'asc' },
      include: {
        cadres: level ? {
          where: {
            level,
            ...(level === 'DISTRICT' && districtId ? { districtId } : {}),
            ...(level === 'UNION' && unionId ? { unionId } : {}),
          },
        } : false,
        _count: level ? {
          select: {
            cadres: {
              where: {
                role: 'CO_COORDINATOR',
                level,
                ...(level === 'DISTRICT' && districtId ? { districtId } : {}),
                ...(level === 'UNION' && unionId ? { unionId } : {}),
              }
            }
          }
        } : false,
      }
    });
  }

  async findMembers(wingId: string, level: CadreLevel, districtId?: string, unionId?: string) {
    const whereClause: any = {
      wingId,
      level,
    };

    if (level === CadreLevel.DISTRICT && districtId) {
      whereClause.districtId = districtId;
    } else if (level === CadreLevel.UNION && unionId) {
      whereClause.unionId = unionId;
    }

    return this.prisma.cadre.findMany({
      where: whereClause,
      include: {
        district: true,
        union: true,
      },
    });
  }

  async assignMember(wingId: string, assignDto: AssignWingMemberDto) {
    const { cadreId, role, level, districtId, unionId } = assignDto;

    // Validate the Cadre exists
    const cadre = await this.prisma.cadre.findUnique({ where: { id: cadreId } });
    if (!cadre) throw new NotFoundException('Cadre not found');

    const isCoordinator = role === 'COORDINATOR';

    const whereClause: any = {
      wingId,
      level,
    };

    if (level === CadreLevel.DISTRICT && districtId) {
      whereClause.districtId = districtId;
    } else if (level === CadreLevel.UNION && unionId) {
      whereClause.unionId = unionId;
    }

    if (isCoordinator) {
      // Check for existing coordinator
      const existingCoordinator = await this.prisma.cadre.findFirst({
        where: {
          ...whereClause,
          role: 'COORDINATOR',
        },
      });

      if (existingCoordinator && existingCoordinator.id !== cadreId) {
        throw new BadRequestException('A wing can only have 1 coordinator at this level. Please remove the existing coordinator first.');
      }
    } else {
      // Check limit for Co-coordinators
      const coCoordinatorCount = await this.prisma.cadre.count({
        where: {
          ...whereClause,
          role: 'CO_COORDINATOR',
        },
      });

      if (coCoordinatorCount >= 10 && cadre.role !== 'CO_COORDINATOR') {
        throw new BadRequestException('A wing can only have up to 10 co-coordinators.');
      }
    }

    // Update the Cadre
    return this.prisma.cadre.update({
      where: { id: cadreId },
      data: {
        wingId,
        role,
        level,
        districtId: districtId || null,
        unionId: unionId || null,
      },
      include: {
        district: true,
        union: true,
      }
    });
  }

  async removeMember(cadreId: string) {
    return this.prisma.cadre.update({
      where: { id: cadreId },
      data: {
        wingId: null,
        role: null,
      },
    });
  }

  async seedWings(wingsData: any[]) {
    const results = [];
    for (let i = 0; i < wingsData.length; i++) {
      const wing = wingsData[i];
      const result = await this.prisma.wing.upsert({
        where: { name: wing.name },
        update: {
          color: wing.color,
          textColor: wing.textColor,
          iconName: wing.iconName,
          order: i + 1,
        },
        create: {
          name: wing.name,
          color: wing.color,
          textColor: wing.textColor,
          iconName: wing.iconName,
          order: i + 1,
        },
      });
      results.push(result);
    }
    return results;
  }
}
