import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoothDto } from './dto/create-booth.dto';
import { UpdateBoothDto } from './dto/update-booth.dto';

@Injectable()
export class BoothsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDistinctAreas() {
    const booths = await this.prisma.booth.findMany({
      select: { area: true },
      distinct: ['area'],
      where: {
        area: {
          not: null,
        },
      },
      orderBy: {
        area: 'asc',
      },
    });
    return booths
      .map((b) => b.area)
      .filter((a) => a && a.trim() !== '') as string[];
  }

  private async sanitizeBoothData(dto: any) {
    const { kilaiIds, agentIds, villageIds, agents, ...rawBoothData } = dto;
    const boothData = { ...rawBoothData };

    if ('unionId' in boothData) {
      const trimmed =
        typeof boothData.unionId === 'string'
          ? boothData.unionId.trim()
          : null;
      if (trimmed && trimmed !== '__NONE__') {
        const union = await this.prisma.union.findUnique({
          where: { id: trimmed },
          select: { id: true },
        });
        boothData.unionId = union ? union.id : null;
      } else {
        boothData.unionId = null;
      }
    }

    if ('panchayatId' in boothData) {
      const trimmed =
        typeof boothData.panchayatId === 'string'
          ? boothData.panchayatId.trim()
          : null;
      if (trimmed && trimmed !== '__NONE__') {
        const panchayat = await this.prisma.panchayat.findUnique({
          where: { id: trimmed },
          select: { id: true, unionId: true },
        });
        if (panchayat) {
          boothData.panchayatId = panchayat.id;
          if (!boothData.unionId && panchayat.unionId) {
            boothData.unionId = panchayat.unionId;
          }
        } else {
          boothData.panchayatId = null;
        }
      } else {
        boothData.panchayatId = null;
      }
    }

    return {
      boothData,
      kilaiIds,
      agentIds,
      villageIds,
    };
  }

  async create(createBoothDto: CreateBoothDto) {
    const { boothData, kilaiIds, agentIds, villageIds } =
      await this.sanitizeBoothData(createBoothDto);

    return this.prisma.booth.create({
      data: {
        ...boothData,
        kilais:
          kilaiIds && kilaiIds.length > 0
            ? {
                connect: kilaiIds.map((id: string) => ({ id })),
              }
            : undefined,
        agents:
          agentIds && agentIds.length > 0
            ? {
                connect: agentIds.map((id: string) => ({ id })),
              }
            : undefined,
        villages:
          villageIds && villageIds.length > 0
            ? {
                connect: villageIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        kilais: true,
        agents: true,
        panchayatRel: true,
        villages: true,
      },
    });
  }

  async findAll(unionId?: string, panchayatId?: string, villageId?: string) {
    const where: any = {};
    if (unionId) where.unionId = unionId;
    if (panchayatId) where.panchayatId = panchayatId;
    if (villageId) {
      where.villages = {
        some: { id: villageId },
      };
    }

    const booths = await this.prisma.booth.findMany({
      where,
      include: {
        union: true,
        panchayatRel: true,
        villages: true,
        kilais: true,
        agents: true,
      },
    });

    // Use natural alphanumeric sorting so "10" comes after "2"
    return booths.sort((a, b) =>
      a.boothNo.localeCompare(b.boothNo, undefined, { numeric: true }),
    );
  }

  async findOne(id: string) {
    const booth = await this.prisma.booth.findUnique({
      where: { id },
      include: {
        union: true,
        panchayatRel: true,
        villages: true,
        kilais: true,
        agents: true,
      },
    });

    if (!booth) {
      throw new NotFoundException(`Booth with ID ${id} not found`);
    }

    return booth;
  }

  async update(id: string, updateBoothDto: UpdateBoothDto) {
    // Check if booth exists
    await this.findOne(id);

    const { boothData, kilaiIds, agentIds, villageIds } =
      await this.sanitizeBoothData(updateBoothDto);

    return this.prisma.booth.update({
      where: { id },
      data: {
        ...boothData,
        kilais:
          kilaiIds !== undefined
            ? {
                set: kilaiIds.map((id: string) => ({ id })),
              }
            : undefined,
        agents:
          agentIds !== undefined
            ? {
                set: agentIds.map((id: string) => ({ id })),
              }
            : undefined,
        villages:
          villageIds !== undefined
            ? {
                set: villageIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        union: true,
        panchayatRel: true,
        villages: true,
        kilais: true,
        agents: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.booth.delete({
      where: { id },
    });
  }
}
