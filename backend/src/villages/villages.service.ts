import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVillageDto } from './dto/create-village.dto';
import { UpdateVillageDto } from './dto/update-village.dto';
import { translateAreaToEnglish, translateAreaToTamil } from '../i18n/area-translations';

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

    const decoded = decodeURIComponent(id).trim();
    const normalized = decoded.replace(/[-_]+/g, ' ').trim();
    const cleanCode = decoded.toLowerCase().replace(/[^a-z0-9]/g, '');
    const enTranslated = translateAreaToEnglish(decoded);
    const enCleanCode = enTranslated ? enTranslated.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    const where = isUuid
      ? { id }
      : {
          OR: [
            ...(cleanCode ? [{ code: cleanCode }] : []),
            { name: { equals: decoded, mode: 'insensitive' as const } },
            { name: { equals: normalized, mode: 'insensitive' as const } },
            { nameTa: { equals: decoded, mode: 'insensitive' as const } },
            { nameTa: { equals: normalized, mode: 'insensitive' as const } },
            ...(enTranslated
              ? [
                  { name: { equals: enTranslated, mode: 'insensitive' as const } },
                  { name: { equals: enTranslated.replace(/[-_]+/g, ' '), mode: 'insensitive' as const } },
                  ...(enCleanCode ? [{ code: enCleanCode }] : []),
                ]
              : []),
          ],
        };

    let village: any = await this.prisma.village.findFirst({
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
                agents: {
                  include: {
                    homeKilai: true,
                    union: true,
                    district: true,
                    officeBearerRoles: true,
                    wing: true,
                  },
                },
                agentAssignments: {
                  include: {
                    cadre: {
                      include: {
                        homeKilai: true,
                        union: true,
                        district: true,
                        officeBearerRoles: true,
                        wing: true,
                      },
                    },
                    election: true,
                  },
                },
                electionResults: {
                  orderBy: { electionYear: 'desc' },
                },
                _count: {
                  select: {
                    agents: true,
                    agentAssignments: true,
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
    });

    if (!village && !isUuid) {
      const allVillages = await this.prisma.village.findMany({
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
                  electionResults: {
                    orderBy: { electionYear: 'desc' },
                  },
                  _count: {
                    select: {
                      agents: true,
                    },
                  },
                },
              },
            },
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
          kilais: {
            include: {
              booths: true,
              _count: {
                select: {
                  cadres: true,
                },
              },
            },
            orderBy: { name: 'asc' },
          },
          _count: {
            select: {
              kilais: true,
              booths: true,
            },
          },
        },
      });

      village =
        allVillages.find((v) => {
          if (v.nameTa && v.nameTa.trim() === decoded) return true;
          const vSlug = (v.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanCode && vSlug === cleanCode) return true;
          if (enCleanCode && vSlug === enCleanCode) return true;
          if (translateAreaToTamil(v.name).trim() === decoded) return true;
          return false;
        }) || null;
    }

    if (!village) {
      throw new NotFoundException(`Village with ID or code "${id}" not found`);
    }

    // 1. Collect all kilais for this village:
    // (a) Directly linked via many-to-many relation _KilaiVillages
    const kilaiMap = new Map<string, any>();
    (village.kilais || []).forEach((k: any) => kilaiMap.set(k.id, k));

    // (b) Legacy kilais from the same panchayat matching this village
    if (village.panchayat?.kilais) {
      const vNameLow = village.name.trim().toLowerCase();
      const vNameTa = (village.nameTa || '').trim();

      village.panchayat.kilais.forEach((k: any) => {
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
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    // 2. Collect booths for this village:
    // (a) Directly linked relational booths to the village (_VillageBooths)
    const boothMap = new Map<string, any>();
    (village.booths || []).forEach((b: any) => boothMap.set(b.id, b));

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

    const currentElection =
      (await this.prisma.election.findFirst({
        where: { isCurrent: true },
      })) ||
      (await this.prisma.election.findFirst({
        orderBy: { year: 'desc' },
      }));

    const mapBoothAgents = (b: any) => {
      let latestAgents: any[] = [];
      if (currentElection) {
        const assignments = (b.agentAssignments || []).filter(
          (a: any) => a.electionId === currentElection.id,
        );
        if (assignments.length > 0) {
          latestAgents = assignments.map((a: any) => ({
            ...a.cadre,
            assignmentRole: a.role,
            assignmentId: a.id,
            blaFormUrl: a.blaFormUrl,
            assignmentNotes: a.notes,
          }));
        }
      }

      if (latestAgents.length === 0 && b.agentAssignments && b.agentAssignments.length > 0) {
        latestAgents = b.agentAssignments.map((a: any) => ({
          ...a.cadre,
          assignmentRole: a.role,
          assignmentId: a.id,
          blaFormUrl: a.blaFormUrl,
          assignmentNotes: a.notes,
        }));
      }

      if (latestAgents.length === 0 && b.agents && b.agents.length > 0) {
        latestAgents = b.agents;
      }

      const agentsMap = new Map<string, any>();
      latestAgents.forEach((a: any) => {
        if (a?.id) agentsMap.set(a.id, a);
      });
      (b.agents || []).forEach((a: any) => {
        if (a?.id && !agentsMap.has(a.id)) {
          agentsMap.set(a.id, a);
        }
      });
      const allAgents = Array.from(agentsMap.values());

      return {
        ...b,
        latestElection: currentElection,
        latestAgents,
        agents: allAgents,
        _count: {
          ...(b._count || {}),
          agents: allAgents.length,
        },
      };
    };

    const allBooths = Array.from(boothMap.values())
      .map(mapBoothAgents)
      .sort((a, b) =>
        (a.boothNo || '').localeCompare(b.boothNo || '', undefined, { numeric: true })
      );

    return {
      ...village,
      kilais: allKilais,
      booths: allBooths,
      panchayat: village.panchayat
        ? {
            ...village.panchayat,
            booths: (village.panchayat.booths || []).map(mapBoothAgents),
          }
        : village.panchayat,
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
