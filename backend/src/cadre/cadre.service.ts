import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CadreLevel } from '@prisma/client';

@Injectable()
export class CadreService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: any) {
    if (payload.wingId) {
      await this.validateWingLimits(payload);
    }
    return this.prisma.cadre.create({
      data: payload,
    });
  }

  private async validateWingLimits(payload: any) {
    const { wingId, role, level, districtId, unionId } = payload;
    if (!wingId || !role || !level) return;

    const count = await this.prisma.cadre.count({
      where: {
        wingId,
        role,
        level,
        ...(level === 'DISTRICT' && districtId ? { districtId } : {}),
        ...(level === 'UNION' && unionId ? { unionId } : {}),
      },
    });

    if (role === 'COORDINATOR' && count >= 1) {
      throw new BadRequestException('A Coordinator already exists for this wing at this level.');
    }
    if (role === 'CO_COORDINATOR' && count >= 10) {
      throw new BadRequestException('Maximum of 10 Co-coordinators are allowed for this wing at this level.');
    }
  }

  async createBulk(payloads: any[]) {
    const aadhaars = payloads.map((p) => p.aadhaarNumber).filter(Boolean);
    const phones = payloads.map((p) => p.phone).filter(Boolean);
    const voterIds = payloads.map((p) => p.voterId).filter(Boolean);

    const orConditions: any[] = [];
    if (aadhaars.length > 0)
      orConditions.push({ aadhaarNumber: { in: aadhaars } });
    if (phones.length > 0) orConditions.push({ phone: { in: phones } });
    if (voterIds.length > 0) orConditions.push({ voterId: { in: voterIds } });

    if (orConditions.length > 0) {
      const existingRecords = await this.prisma.cadre.findMany({
        where: { OR: orConditions },
        select: {
          name: true,
          phone: true,
          aadhaarNumber: true,
          voterId: true,
          level: true,
          unionId: true,
          homeKilaiId: true,
        },
      });

      if (existingRecords.length > 0) {
        const duplicates = [];

        for (const payload of payloads) {
          const matching = existingRecords.find(
            (r) =>
              (payload.phone && r.phone === payload.phone) ||
              (payload.aadhaarNumber &&
                r.aadhaarNumber === payload.aadhaarNumber) ||
              (payload.voterId && r.voterId === payload.voterId),
          );

          if (matching) {
            const reason = [];
            if (payload.phone && matching.phone === payload.phone)
              reason.push('Phone');
            if (
              payload.aadhaarNumber &&
              matching.aadhaarNumber === payload.aadhaarNumber
            )
              reason.push('Aadhaar');
            if (payload.voterId && matching.voterId === payload.voterId)
              reason.push('Voter ID');

            duplicates.push({
              name: payload.name || 'Unknown',
              phone: payload.phone || '-',
              aadhaarNumber: payload.aadhaarNumber || '-',
              voterId: payload.voterId || '-',
              reason: `${reason.join(', ')} already exists`,
            });
          }
        }

        if (duplicates.length > 0) {
          throw new BadRequestException({
            message: 'Duplicate records found',
            duplicates,
          });
        }
      }
    }

    const result = await this.prisma.cadre.createMany({
      data: payloads,
    });

    return { message: 'Cadres imported successfully', count: result.count };
  }

  async findAll(query: any) {
    const {
      level,
      districtId,
      districtGroup,
      unionId,
      kilaiId,
      search,
      limit,
      isWing,
      wingId,
    } = query;
    const where: any = {};

    if (level) where.level = level;
    if (districtId) where.districtId = districtId;
    if (districtGroup) where.districtGroup = districtGroup;
    if (unionId) where.unionId = unionId;
    if (kilaiId) where.kilaiId = kilaiId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (isWing === 'true') {
      where.role = { in: ['COORDINATOR', 'CO_COORDINATOR'] };
      if (wingId) where.wingId = wingId;
    } else {
      where.OR = [
        { role: null },
        { role: { notIn: ['COORDINATOR', 'CO_COORDINATOR'] } }
      ];
    }

    const limitNum = limit ? parseInt(limit, 10) : undefined;

    const cadres = await this.prisma.cadre.findMany({
      where,
      ...(limitNum && { take: limitNum }),
      include: {
        wing: isWing === 'true',
      },
      orderBy: { createdAt: 'desc' },
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
      COORDINATOR: 6,
      CO_COORDINATOR: 7,
    };

    return cadres.sort((a, b) => {
      if (isWing === 'true') {
        const wingOrderA = (a as any).wing?.order || 999;
        const wingOrderB = (b as any).wing?.order || 999;
        if (wingOrderA !== wingOrderB) return wingOrderA - wingOrderB;
      }

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

    if (payload.wingId && (payload.role !== cadre.role || payload.wingId !== cadre.wingId)) {
      await this.validateWingLimits({ ...cadre, ...payload });
    }

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
