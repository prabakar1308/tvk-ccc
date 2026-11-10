import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePanchayatDto } from './dto/create-panchayat.dto';
import { UpdatePanchayatDto } from './dto/update-panchayat.dto';
import { UpdatePanchayatGeoDto } from './dto/update-geo.dto';

@Injectable()
export class PanchayatsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(unionId?: string, search?: string) {
    const where: any = {};
    if (unionId) {
      where.unionId = unionId;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { nameTa: { contains: q } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.panchayat.findMany({
      where,
      include: {
        union: {
          select: {
            id: true,
            name: true,
            unitType: true,
            group: true,
          },
        },
        _count: {
          select: {
            villages: true,
            kilais: true,
            booths: true,
          },
        },
      },
      orderBy: [
        { wardNumber: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    // Supports querying by UUID, code, or name slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const cleanCode = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const where = isUuid
      ? { id }
      : {
          OR: [
            { code: cleanCode },
            { name: { equals: id, mode: 'insensitive' as const } },
            { name: { equals: id.replace(/-/g, ' '), mode: 'insensitive' as const } },
          ],
        };

    const panchayat = await this.prisma.panchayat.findFirst({
      where,
      include: {
        union: {
          include: {
            district: true,
          },
        },
        villages: {
          include: {
            kilais: {
              include: {
                booths: {
                  orderBy: { boothNo: 'asc' },
                },
                cadres: {
                  orderBy: { createdAt: 'asc' },
                },
                _count: {
                  select: {
                    cadres: true,
                  },
                },
              },
              orderBy: { name: 'asc' },
            },
            booths: {
              include: {
                kilais: true,
                agents: true,
                electionResults: {
                  orderBy: { electionYear: 'desc' },
                },
                _count: {
                  select: {
                    agents: true,
                  },
                },
              },
              orderBy: { boothNo: 'asc' },
            },
            _count: {
              select: {
                kilais: true,
                booths: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
        kilais: {
          include: {
            booths: {
              orderBy: { boothNo: 'asc' },
            },
            villagesRel: true,
            cadres: {
              orderBy: { createdAt: 'asc' },
            },
            _count: {
              select: {
                cadres: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
        booths: {
          include: {
            kilais: true,
            villages: true,
            agents: true,
            electionResults: {
              orderBy: { electionYear: 'desc' },
            },
            _count: {
              select: {
                agents: true,
              },
            },
          },
          orderBy: { boothNo: 'asc' },
        },
        _count: {
          select: {
            villages: true,
            kilais: true,
            booths: true,
          },
        },
      },
    });

    if (!panchayat) {
      throw new NotFoundException(`Panchayat with ID or slug "${id}" not found`);
    }

    return panchayat;
  }

  async create(dto: CreatePanchayatDto) {
    return this.prisma.panchayat.create({
      data: {
        ...dto,
        code:
          dto.code ||
          dto.name.toLowerCase().replace(/[^a-z0-9]/g, '').trim(),
      },
      include: {
        union: true,
      },
    });
  }

  async update(id: string, dto: UpdatePanchayatDto) {
    await this.findOne(id);
    return this.prisma.panchayat.update({
      where: { id },
      data: dto,
      include: {
        union: true,
      },
    });
  }

  async updateGeo(id: string, dto: UpdatePanchayatGeoDto) {
    const panchayat = await this.findOne(id);
    return this.prisma.panchayat.update({
      where: { id: panchayat.id },
      data: {
        centerLat: dto.centerLat !== undefined ? dto.centerLat : undefined,
        centerLng: dto.centerLng !== undefined ? dto.centerLng : undefined,
        boundary: dto.boundary !== undefined ? dto.boundary : undefined,
      },
    });
  }

  async remove(id: string) {
    const panchayat = await this.findOne(id);
    return this.prisma.panchayat.delete({
      where: { id: panchayat.id },
    });
  }
}
