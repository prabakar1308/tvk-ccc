import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateKilaiDto } from './dto/create-kilai.dto';
import { UpdateKilaiDto } from './dto/update-kilai.dto';
import { translateAreaToEnglish, translateAreaToTamil } from '../i18n/area-translations';

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

    const rawName = (createData.name || '').trim();
    const isTaScript = /[\u0B80-\u0BFF]/.test(rawName);
    let enName = isTaScript
      ? translateAreaToEnglish(rawName) || rawName
      : rawName;

    // If enName still contains Tamil characters, translate with Google Cloud API
    if (/[\u0B80-\u0BFF]/.test(enName)) {
      const cloudEn = await this.i18nService.translate(enName, 'en', 'ta');
      if (cloudEn && !/[\u0B80-\u0BFF]/.test(cloudEn)) {
        enName = cloudEn;
      }
    }

    let taName =
      createData.tamilName ||
      createData.nameTa ||
      (createData.translations as any)?.ta?.name ||
      (isTaScript ? rawName : translateAreaToTamil(rawName));

    // If taName is still English, translate to Tamil with Google Cloud API
    if (!/[\u0B80-\u0BFF]/.test(taName) && enName) {
      const cloudTa = await this.i18nService.translate(enName, 'ta', 'en');
      if (cloudTa && /[\u0B80-\u0BFF]/.test(cloudTa)) {
        taName = cloudTa;
      }
    }

    createData.name = enName;
    delete createData.tamilName;
    delete createData.nameTa;

    if (!createData.translations) {
      createData.translations = {
        en: { name: enName, description: createData.description },
        ta: { name: taName, description: createData.description },
      };
    } else {
      createData.translations.en = {
        name: enName,
        ...(createData.translations.en || {}),
      };
      createData.translations.ta = {
        name: taName,
        ...(createData.translations.ta || {}),
      };
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

  private async resolveKilaiId(idOrSlug: string): Promise<string> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUuid) return idOrSlug;

    const kilai = await this.findOne(idOrSlug);
    return kilai.id;
  }

  async findOne(id: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let kilai: any = null;

    if (isUuid) {
      kilai = await this.prisma.kilai.findUnique({
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
    }

    if (!kilai) {
      const decoded = decodeURIComponent(id).trim();
      const normalizedName = decoded.replace(/[-_]+/g, ' ').trim();
      const cleanSlug = decoded.toLowerCase().replace(/[^a-z0-9]/g, '');
      const enTranslated = translateAreaToEnglish(decoded);
      const enSlug = enTranslated ? enTranslated.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

      // 1. Try exact or normalized name match (including translated English name if Tamil was provided)
      kilai = await this.prisma.kilai.findFirst({
        where: {
          OR: [
            { id: decoded },
            { name: { equals: decoded, mode: 'insensitive' as const } },
            { name: { equals: normalizedName, mode: 'insensitive' as const } },
            ...(enTranslated
              ? [
                  { name: { equals: enTranslated, mode: 'insensitive' as const } },
                  { name: { equals: enTranslated.replace(/[-_]+/g, ' '), mode: 'insensitive' as const } },
                ]
              : []),
          ],
        },
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

      // 2. Fallback: match by alphanumeric slug or translations
      if (!kilai) {
        const allKilais = await this.prisma.kilai.findMany({
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

        kilai =
          allKilais.find((k) => {
            const kSlug = (k.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanSlug && kSlug === cleanSlug) return true;
            if (enSlug && kSlug === enSlug) return true;

            const trans = k.translations as any;
            if (trans?.ta?.name && trans.ta.name.trim() === decoded) return true;
            if (translateAreaToTamil(k.name).trim() === decoded) return true;

            return false;
          }) || null;
      }
    }

    if (!kilai) {
      throw new NotFoundException(`Kilai with ID or name "${id}" not found`);
    }

    const kilaiCadres = await this.prisma.cadre.findMany({
      where: {
        homeKilaiId: kilai.id,
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
      President: 1,
      Secretary: 2,
      'Joint Secretary': 3,
      Treasurer: 4,
      'Deputy Secretary': 5,
      'Executive Committee Member': 6,
      'EC Member': 6,
    };

    const getRoleRank = (cadre: any) => {
      const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || '';
      const norm = rawRole.toUpperCase().replace(/[_\s-]+/g, ' ').trim();
      if (norm.includes('PRESIDENT') || rawRole.includes('தலைவர்')) return 1;
      if (
        norm.includes('JOINT SECRETARY') ||
        rawRole.includes('இணைச் செயலாளர்') ||
        (rawRole.includes('இணை') && rawRole.includes('செயலாளர்'))
      ) {
        return 3;
      }
      if (
        norm.includes('DEPUTY SECRETARY') ||
        rawRole.includes('துணைச் செயலாளர்') ||
        (rawRole.includes('துணை') && rawRole.includes('செயலாளர்'))
      ) {
        return 5;
      }
      if (norm.includes('SECRETARY') || rawRole.includes('செயலாளர்')) return 2;
      if (norm.includes('TREASURER') || rawRole.includes('பொருளாளர்')) return 4;
      if (norm.includes('EXECUTIVE') || norm.includes('EC') || rawRole.includes('செயற்குழு')) return 6;
      if (
        norm === 'CO COORDINATOR' ||
        norm === 'COCOORDINATOR' ||
        norm.includes('CO COORDINATOR') ||
        norm.includes('CO_COORDINATOR') ||
        norm.includes('CO-COORDINATOR') ||
        rawRole.includes('இணை ஒருங்கிணைப்பாளர்') ||
        (rawRole.includes('இணை') && rawRole.includes('ஒருங்கிணைப்பாளர்'))
      ) {
        return 8;
      }
      if (norm === 'COORDINATOR' || rawRole.includes('ஒருங்கிணைப்பாளர்')) return 7;
      return ROLE_WEIGHTS[cadre.role || ''] || 99;
    };

    kilaiCadres.sort((a, b) => {
      const levelA = LEVEL_WEIGHTS[a.level] || 99;
      const levelB = LEVEL_WEIGHTS[b.level] || 99;

      if (levelA !== levelB) {
        return levelA - levelB;
      }

      const rankA = getRoleRank(a);
      const rankB = getRoleRank(b);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // If roles are identical, sort by position!
      const posA = a.position && a.position > 0 ? a.position : 9999;
      const posB = b.position && b.position > 0 ? b.position : 9999;
      if (posA !== posB) return posA - posB;

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

    if (updateData.name) {
      const rawUpdateName = (updateData.name || '').trim();
      const isTaScriptUpdate = /[\u0B80-\u0BFF]/.test(rawUpdateName);
      let enNameUpdate = isTaScriptUpdate
        ? translateAreaToEnglish(rawUpdateName) || rawUpdateName
        : rawUpdateName;

      if (/[\u0B80-\u0BFF]/.test(enNameUpdate)) {
        const cloudEn = await this.i18nService.translate(enNameUpdate, 'en', 'ta');
        if (cloudEn && !/[\u0B80-\u0BFF]/.test(cloudEn)) {
          enNameUpdate = cloudEn;
        }
      }

      let taNameUpdate =
        updateData.tamilName ||
        updateData.nameTa ||
        (updateData.translations as any)?.ta?.name ||
        (isTaScriptUpdate ? rawUpdateName : translateAreaToTamil(rawUpdateName));

      if (!/[\u0B80-\u0BFF]/.test(taNameUpdate) && enNameUpdate) {
        const cloudTa = await this.i18nService.translate(enNameUpdate, 'ta', 'en');
        if (cloudTa && /[\u0B80-\u0BFF]/.test(cloudTa)) {
          taNameUpdate = cloudTa;
        }
      }

      updateData.name = enNameUpdate;
      delete updateData.tamilName;
      delete updateData.nameTa;

      if (!updateData.translations) {
        updateData.translations = {
          en: { name: enNameUpdate },
          ta: { name: taNameUpdate },
        };
      } else {
        updateData.translations.en = {
          name: enNameUpdate,
          ...(updateData.translations.en || {}),
        };
        updateData.translations.ta = {
          name: taNameUpdate,
          ...(updateData.translations.ta || {}),
        };
      }
    }

    const resolvedId = await this.resolveKilaiId(id);

    return this.prisma.kilai.update({
      where: { id: resolvedId },
      data: updateData,
      include: {
        panchayatRel: true,
        villagesRel: true,
        booths: true,
      },
    });
  }

  async remove(id: string) {
    const resolvedId = await this.resolveKilaiId(id);
    const kilai = await this.prisma.kilai.findUnique({ where: { id: resolvedId } });
    if (!kilai) {
      throw new NotFoundException(`Kilai with ID ${id} not found`);
    }

    // Instead of actual deletion, we could soft delete, but for now we'll update status
    return this.prisma.kilai.update({
      where: { id: resolvedId },
      data: { status: 'INACTIVE' },
    });
  }

  // --- Sub resources ---

  async getOfficeBearers(kilaiId: string) {
    const resolvedId = await this.resolveKilaiId(kilaiId);
    return this.prisma.officeBearer.findMany({
      where: { kilaiId: resolvedId },
      include: { cadre: true },
      orderBy: { joinedOn: 'desc' },
    });
  }

  async addOfficeBearer(kilaiId: string, payload: any) {
    const resolvedId = await this.resolveKilaiId(kilaiId);
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
          homeKilaiId: resolvedId, // Or keep existing
        },
        create: {
          memberId: cadre.memberId,
          name: cadre.name,
          phone: cadre.phone,
          aadhaarNumber: cadre.aadhaarNumber,
          voterId: cadre.voterId,
          photoUrl: cadre.photoUrl,
          attachments: cadre.attachments,
          homeKilaiId: resolvedId,
        },
      });

      // Create Office Bearer
      const bearer = await tx.officeBearer.create({
        data: {
          role,
          status: status || 'ACTIVE',
          joinedOn: joinedOn ? new Date(joinedOn) : new Date(),
          kilaiId: resolvedId,
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
