import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVillageDto } from './dto/create-village.dto';
import { UpdateVillageDto } from './dto/update-village.dto';

@Injectable()
export class VillagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(panchayatId?: string, search?: string) {
    const where: any = {};
    if (panchayatId) {
      where.panchayatId = panchayatId;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { nameTa: { contains: q } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.village.findMany({
      where,
      include: {
        panchayat: {
          select: {
            id: true,
            name: true,
            nameTa: true,
            type: true,
            unionId: true,
          },
        },
        _count: {
          select: {
            kilais: true,
            booths: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
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

    const village = await this.prisma.village.findFirst({
      where,
      include: {
        panchayat: {
          include: {
            union: {
              include: {
                district: true,
              },
            },
            booths: {
              include: {
                kilais: true,
                agents: true,
                _count: {
                  select: {
                    agents: true,
                  },
                },
              },
              orderBy: { boothNo: 'asc' },
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
          },
        },
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
    });

    if (!village) {
      throw new NotFoundException(`Village with ID or code "${id}" not found`);
    }

    // 1. Collect all kilais for this village:
    // (a) Directly linked via many-to-many relation _KilaiVillages
    const kilaiMap = new Map<string, any>();
    (village.kilais || []).forEach((k) => kilaiMap.set(k.id, k));

    // (b) Legacy kilais from the same panchayat matching this village
    if (village.panchayat?.kilais) {
      const vNameLow = village.name.trim().toLowerCase();
      const vNameTa = (village.nameTa || '').trim();

      village.panchayat.kilais.forEach((k) => {
        const matchesRel = (k.villagesRel || []).some((vr: any) => vr.id === village.id);
        const matchesLegacy = (k.villages || []).some(
          (vn: string) =>
            vn.trim().toLowerCase() === vNameLow ||
            (vNameTa && vn.trim() === vNameTa)
        );
        const matchesExactName =
          k.name.trim().toLowerCase() === vNameLow ||
          (vNameTa && k.name.trim() === vNameTa);

        if (matchesRel || matchesLegacy || matchesExactName) {
          if (!kilaiMap.has(k.id)) {
            kilaiMap.set(k.id, k);
          }
        }
      });
    }

    const allKilais = Array.from(kilaiMap.values())
      .map((k: any) => ({
        ...k,
        booths: (k.booths || []).sort((a: any, b: any) =>
          (a.boothNo || '').localeCompare(b.boothNo || '', undefined, { numeric: true })
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // 2. Collect booths for this village:
    // (a) Directly linked relational booths to the village (_VillageBooths)
    const boothMap = new Map<string, any>();
    (village.booths || []).forEach((b) => boothMap.set(b.id, b));

    // (b) Booths linked to this village's assigned TVK kilais
    allKilais.forEach((k: any) => {
      (k.booths || []).forEach((b: any) => {
        if (!boothMap.has(b.id)) {
          boothMap.set(b.id, b);
        }
      });
    });

    // (c) Fallback ONLY if no booths found yet: check exact area match
    if (boothMap.size === 0 && village.panchayat?.booths) {
      const vNameLow = village.name.trim().toLowerCase();
      const vNameTa = (village.nameTa || '').trim();

      village.panchayat.booths.forEach((b: any) => {
        const areaClean = (b.area || '').trim().toLowerCase();
        if (
          areaClean &&
          (areaClean === vNameLow || (vNameTa && b.area && b.area.trim() === vNameTa))
        ) {
          if (!boothMap.has(b.id)) {
            boothMap.set(b.id, b);
          }
        }
      });
    }

    const allBooths = Array.from(boothMap.values()).sort((a, b) =>
      (a.boothNo || '').localeCompare(b.boothNo || '', undefined, { numeric: true })
    );

    return {
      ...village,
      kilais: allKilais,
      booths: allBooths,
      _count: {
        kilais: allKilais.length,
        booths: allBooths.length,
      },
    };
  }

  async create(dto: CreateVillageDto) {
    return this.prisma.village.create({
      data: {
        ...dto,
        code:
          dto.code ||
          dto.name.toLowerCase().replace(/[^a-z0-9]/g, '').trim(),
      },
      include: {
        panchayat: true,
      },
    });
  }

  async update(id: string, dto: UpdateVillageDto) {
    await this.findOne(id);
    return this.prisma.village.update({
      where: { id },
      data: dto,
      include: {
        panchayat: true,
      },
    });
  }

  async remove(id: string) {
    const village = await this.findOne(id);
    return this.prisma.village.delete({
      where: { id: village.id },
    });
  }
}
