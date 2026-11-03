import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateKilaiDto } from './dto/create-kilai.dto';
import { UpdateKilaiDto } from './dto/update-kilai.dto';

@Injectable()
export class KilaisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18nService: I18nService,
  ) {}

  async create(createKilaiDto: CreateKilaiDto) {
    const { linkedBooths, villageIds, ...data } = createKilaiDto;
    const createData: any = { ...data };

    if (!createData.panchayatId && createData.panchayat) {
      const matchPanchayat = await this.prisma.panchayat.findFirst({
        where: {
          OR: [
            { name: { equals: createData.panchayat.trim(), mode: 'insensitive' } },
            { nameTa: { equals: createData.panchayat.trim(), mode: 'insensitive' } },
          ],
          ...(createData.unionId ? { unionId: createData.unionId } : {}),
        },
      });
      if (matchPanchayat) {
        createData.panchayatId = matchPanchayat.id;
      }
    }

    if (linkedBooths && linkedBooths.length > 0) {
      createData.booths = {
        connect: linkedBooths.map((identifier: string) => {
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              identifier,
            );
          return isUuid ? { id: identifier } : { boothNo: identifier };
        }),
      };
    }

    const resolvedVillageIds = new Set<string>(villageIds || []);
    if (createData.villages && createData.villages.length > 0) {
      const matchingVillages = await this.prisma.village.findMany({
        where: {
          OR: createData.villages.flatMap((vName: string) => [
            { name: { equals: vName.trim(), mode: 'insensitive' } },
            { nameTa: { equals: vName.trim(), mode: 'insensitive' } },
          ]),
          ...(createData.panchayatId ? { panchayatId: createData.panchayatId } : {}),
        },
      });
      matchingVillages.forEach((v) => resolvedVillageIds.add(v.id));

      if (createData.panchayatId) {
        for (const vName of createData.villages) {
          const trimmed = vName.trim();
          if (!trimmed) continue;
          const exists = matchingVillages.some(
            (v) =>
              v.name.toLowerCase() === trimmed.toLowerCase() ||
              (v.nameTa && v.nameTa.toLowerCase() === trimmed.toLowerCase()),
          );
          if (!exists) {
            const newVillage = await this.prisma.village.create({
              data: {
                name: trimmed,
                nameTa: trimmed,
                code: trimmed.toLowerCase().replace(/[^a-z0-9]/g, '').trim() || undefined,
                panchayatId: createData.panchayatId,
              },
            });
            resolvedVillageIds.add(newVillage.id);
          }
        }
      }
    }

    if (resolvedVillageIds.size > 0) {
      createData.villagesRel = {
        connect: Array.from(resolvedVillageIds).map((id: string) => ({ id })),
      };
    }

    if (createData.name && !createData.translations) {
      createData.translations =
        await this.i18nService.generateTranslationsForEntity({
          name: createData.name,
          description: createData.description,
        });
    }

    return this.prisma.kilai.create({
      data: createData,
      include: {
        panchayatRel: true,
        villagesRel: true,
        booths: true,
      },
    });
  }

  async createBulk(createKilaiDtos: CreateKilaiDto[]) {
    const panchayats = await this.prisma.panchayat.findMany();
    const villages = await this.prisma.village.findMany();

    return this.prisma.$transaction(
      createKilaiDtos.map((dto) => {
        const { linkedBooths, villageIds, ...data } = dto;
        const createData: any = { ...data };

        if (!createData.panchayatId && createData.panchayat) {
          const pNorm = createData.panchayat.trim().toLowerCase();
          const matched = panchayats.find(
            (p) =>
              (p.name.toLowerCase() === pNorm ||
                (p.nameTa && p.nameTa.toLowerCase() === pNorm)) &&
              (!createData.unionId || p.unionId === createData.unionId),
          );
          if (matched) {
            createData.panchayatId = matched.id;
          }
        }

        if (linkedBooths && linkedBooths.length > 0) {
          createData.booths = {
            connect: linkedBooths.map((identifier: string) => {
              const isUuid =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                  identifier,
                );
              return isUuid ? { id: identifier } : { boothNo: identifier };
            }),
          };
        }

        const resolvedVIds = new Set<string>(villageIds || []);
        if (createData.villages && createData.villages.length > 0) {
          createData.villages.forEach((vName: string) => {
            const vNorm = vName.trim().toLowerCase();
            const matchedV = villages.find(
              (v) =>
                (v.name.toLowerCase() === vNorm ||
                  (v.nameTa && v.nameTa.toLowerCase() === vNorm)) &&
                (!createData.panchayatId || v.panchayatId === createData.panchayatId),
            );
            if (matchedV) {
              resolvedVIds.add(matchedV.id);
            }
          });
        }

        if (resolvedVIds.size > 0) {
          createData.villagesRel = {
            connect: Array.from(resolvedVIds).map((id: string) => ({ id })),
          };
        }

        return this.prisma.kilai.create({ data: createData });
      }),
    );
  }

  async findAll(unionId?: string) {
    const where = unionId ? { unionId } : {};
    const kilais = await this.prisma.kilai.findMany({
      where,
      include: {
        union: true,
        panchayatRel: true,
        villagesRel: true,
        booths: true,
        _count: {
          select: {
            cadres: true,
          },
        },
        cadres: {
          where: {
            OR: [
              { role: { equals: 'Secretary', mode: 'insensitive' } },
              { role: { equals: 'SECRETARY', mode: 'insensitive' } },
              { officeBearerRoles: { some: { role: 'SECRETARY' } } },
            ],
          },
          include: { officeBearerRoles: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return kilais.map((kilai) => {
      const { cadres, ...rest } = kilai;
      return {
        ...rest,
        secretary: cadres && cadres.length > 0 ? cadres[0] : null,
      };
    });
  }

  async findOne(id: string) {
    const kilai = await this.prisma.kilai.findUnique({
      where: { id },
      include: {
        union: true,
        panchayatRel: true,
        villagesRel: true,
        booths: true,
        officeBearers: {
          include: { cadre: true },
        },
        _count: {
          select: {
            cadres: true,
          },
        },
      },
    });

    if (!kilai) {
      throw new NotFoundException(`Kilai with ID ${id} not found`);
    }

    const kilaiCadres = await this.prisma.cadre.findMany({
      where: {
        homeKilaiId: id,
        level: 'KILAI',
      },
      include: {
        officeBearerRoles: true,
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
    };

    kilaiCadres.sort((a, b) => {
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
      ...kilai,
      kilaiCadres,
    };
  }

  async update(id: string, updateKilaiDto: UpdateKilaiDto) {
    const kilai = await this.prisma.kilai.findUnique({ where: { id } });
    if (!kilai) {
      throw new NotFoundException(`Kilai with ID ${id} not found`);
    }

    const { linkedBooths, villageIds, ...data } = updateKilaiDto;
    const updateData: any = { ...data };

    if (!updateData.panchayatId && updateData.panchayat) {
      const matchPanchayat = await this.prisma.panchayat.findFirst({
        where: {
          OR: [
            { name: { equals: updateData.panchayat.trim(), mode: 'insensitive' } },
            { nameTa: { equals: updateData.panchayat.trim(), mode: 'insensitive' } },
          ],
          unionId: updateData.unionId || kilai.unionId,
        },
      });
      if (matchPanchayat) {
        updateData.panchayatId = matchPanchayat.id;
      }
    }

    if (linkedBooths !== undefined) {
      updateData.booths = {
        set: linkedBooths.map((identifier: string) => {
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              identifier,
            );
          return isUuid ? { id: identifier } : { boothNo: identifier };
        }),
      };
    }

    const pId = updateData.panchayatId || kilai.panchayatId;
    const resolvedUpdateVillageIds = new Set<string>(villageIds || []);

    if (updateData.villages && updateData.villages.length > 0) {
      const matchingVillages = await this.prisma.village.findMany({
        where: {
          OR: updateData.villages.flatMap((vName: string) => [
            { name: { equals: vName.trim(), mode: 'insensitive' } },
            { nameTa: { equals: vName.trim(), mode: 'insensitive' } },
          ]),
          ...(pId ? { panchayatId: pId } : {}),
        },
      });
      matchingVillages.forEach((v) => resolvedUpdateVillageIds.add(v.id));

      if (pId) {
        for (const vName of updateData.villages) {
          const trimmed = vName.trim();
          if (!trimmed) continue;
          const exists = matchingVillages.some(
            (v) =>
              v.name.toLowerCase() === trimmed.toLowerCase() ||
              (v.nameTa && v.nameTa.toLowerCase() === trimmed.toLowerCase()),
          );
          if (!exists) {
            const newVillage = await this.prisma.village.create({
              data: {
                name: trimmed,
                nameTa: trimmed,
                code: trimmed.toLowerCase().replace(/[^a-z0-9]/g, '').trim() || undefined,
                panchayatId: pId,
              },
            });
            resolvedUpdateVillageIds.add(newVillage.id);
          }
        }
      }
    }

    if (villageIds !== undefined || updateData.villages !== undefined) {
      updateData.villagesRel = {
        set: Array.from(resolvedUpdateVillageIds).map((villageId: string) => ({ id: villageId })),
      };
    }

    return this.prisma.kilai.update({
      where: { id },
      data: updateData,
      include: {
        panchayatRel: true,
        villagesRel: true,
        booths: true,
      },
    });
  }

  async remove(id: string) {
    const kilai = await this.prisma.kilai.findUnique({ where: { id } });
    if (!kilai) {
      throw new NotFoundException(`Kilai with ID ${id} not found`);
    }

    // Instead of actual deletion, we could soft delete, but for now we'll update status
    return this.prisma.kilai.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  // --- Sub resources ---

  async getOfficeBearers(kilaiId: string) {
    return this.prisma.officeBearer.findMany({
      where: { kilaiId },
      include: { cadre: true },
      orderBy: { joinedOn: 'desc' },
    });
  }

  async addOfficeBearer(kilaiId: string, payload: any) {
    const { role, status, joinedOn, cadre } = payload;

    return this.prisma.$transaction(async (tx) => {
      // Upsert Cadre using memberId
      const savedCadre = await tx.cadre.upsert({
        where: { memberId: cadre.memberId },
        update: {
          name: cadre.name,
          phone: cadre.phone,
          aadhaarNumber: cadre.aadhaarNumber,
          voterId: cadre.voterId,
          photoUrl: cadre.photoUrl,
          attachments: cadre.attachments,
          homeKilaiId: kilaiId, // Or keep existing
        },
        create: {
          memberId: cadre.memberId,
          name: cadre.name,
          phone: cadre.phone,
          aadhaarNumber: cadre.aadhaarNumber,
          voterId: cadre.voterId,
          photoUrl: cadre.photoUrl,
          attachments: cadre.attachments,
          homeKilaiId: kilaiId,
        },
      });

      // Create Office Bearer
      const bearer = await tx.officeBearer.create({
        data: {
          role,
          status: status || 'ACTIVE',
          joinedOn: joinedOn ? new Date(joinedOn) : new Date(),
          kilaiId,
          cadreId: savedCadre.id,
        },
        include: { cadre: true },
      });

      return bearer;
    });
  }

  async updateOfficeBearer(kilaiId: string, bearerId: string, payload: any) {
    const { role, status, joinedOn, cadre } = payload;

    return this.prisma.$transaction(async (tx) => {
      const existingBearer = await tx.officeBearer.findUnique({
        where: { id: bearerId },
        include: { cadre: true },
      });

      if (!existingBearer)
        throw new NotFoundException('Office Bearer not found');

      // Update Cadre
      if (cadre) {
        await tx.cadre.update({
          where: { id: existingBearer.cadreId },
          data: {
            memberId: cadre.memberId,
            name: cadre.name,
            phone: cadre.phone,
            aadhaarNumber: cadre.aadhaarNumber,
            voterId: cadre.voterId,
            photoUrl: cadre.photoUrl,
            attachments: cadre.attachments,
          },
        });
      }

      // Update Office Bearer
      const updatedBearer = await tx.officeBearer.update({
        where: { id: bearerId },
        data: {
          ...(role && { role }),
          ...(status && { status }),
          ...(joinedOn && { joinedOn: new Date(joinedOn) }),
        },
        include: { cadre: true },
      });

      return updatedBearer;
    });
  }

  async removeOfficeBearer(kilaiId: string, bearerId: string) {
    return this.prisma.officeBearer.delete({
      where: { id: bearerId },
    });
  }
}
