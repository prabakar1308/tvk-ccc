import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePanchayatDto } from './dto/create-panchayat.dto';
import { UpdatePanchayatDto } from './dto/update-panchayat.dto';
import { UpdatePanchayatGeoDto } from './dto/update-geo.dto';
import { translateAreaToEnglish, translateAreaToTamil } from '../i18n/area-translations';

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
    // Supports querying by UUID, code, name slug, or Tamil name
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

    let panchayat: any = await this.prisma.panchayat.findFirst({
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
        _count: {
          select: {
            villages: true,
            kilais: true,
            booths: true,
          },
        },
      },
    });

    if (!panchayat && !isUuid) {
      const allPanchayats: any[] = await this.prisma.panchayat.findMany({
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

      panchayat =
        allPanchayats.find((p) => {
          if (p.nameTa && p.nameTa.trim() === decoded) return true;
          const pSlug = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanCode && pSlug === cleanCode) return true;
          if (enCleanCode && pSlug === enCleanCode) return true;
          const trans = p.translations as any;
          if (trans?.ta?.name && trans.ta.name.trim() === decoded) return true;
          if (translateAreaToTamil(p.name).trim() === decoded) return true;
          return false;
        }) || null;
    }

    if (!panchayat) {
      throw new NotFoundException(`Panchayat with ID or slug "${id}" not found`);
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

    return {
      ...panchayat,
      booths: (panchayat.booths || []).map(mapBoothAgents),
      villages: (panchayat.villages || []).map((v: any) => ({
        ...v,
        booths: (v.booths || []).map(mapBoothAgents),
      })),
    };
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
