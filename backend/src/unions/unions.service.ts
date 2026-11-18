import { Injectable } from '@nestjs/common';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';
import { PrismaService } from '../prisma/prisma.service';
import { translateAreaToTamil, getMasterAreas } from '../i18n/area-translations';
import { translatePersonNameToTamil } from '../i18n/name-translations';
import { translateOrgUnitNameToTamil, translateOrgUnitNameToEnglish } from '../i18n/org-unit-translations';

@Injectable()
export class UnionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMasterAreas() {
    const dbPanchayats = await this.prisma.panchayat.findMany({
      select: { name: true, nameTa: true },
      distinct: ['name'],
      orderBy: { name: 'asc' },
    });
    if (dbPanchayats.length > 0) {
      return dbPanchayats;
    }
    return getMasterAreas();
  }

  async create(createUnionDto: CreateUnionDto) {
    const data: any = { ...createUnionDto };

    if (data.name && typeof data.name === 'string') {
      const taName = translateOrgUnitNameToTamil(data.name);
      data.translations = {
        ...(data.translations || {}),
        ta: {
          ...(data.translations?.ta || {}),
          name: taName,
        },
      };
    }

    if (data.areasCovered && Array.isArray(data.areasCovered)) {
      const taAreas = data.areasCovered.map((a: string) => translateAreaToTamil(a));
      data.translations = {
        ...(data.translations || {}),
        ta: {
          ...(data.translations?.ta || {}),
          areasCovered: taAreas,
        },
      };
    }

    if (data.contactName && typeof data.contactName === 'string') {
      const taContact = translatePersonNameToTamil(data.contactName);
      data.translations = {
        ...(data.translations || {}),
        ta: {
          ...(data.translations?.ta || {}),
          contactName: taContact,
        },
      };
    }

    return this.prisma.union.create({
      data: data as any,
    });
  }

  async findAll() {
    const unions = await this.prisma.union.findMany({
      include: { 
        district: true,
        _count: {
          select: {
            kilais: true,
            cadres: true,
          },
        },
        cadres: {
          where: { 
            level: 'UNION',
            OR: [
              { role: { equals: 'Secretary', mode: 'insensitive' } },
              { role: { equals: 'SECRETARY', mode: 'insensitive' } },
              { officeBearerRoles: { some: { role: 'SECRETARY' } } }
            ]
          },
          include: { officeBearerRoles: true },
          take: 1
        }
      },
      orderBy: { name: 'asc' },
    });
    
    return unions.map(union => {
      const { cadres, ...rest } = union;
      return {
        ...rest,
        secretary: cadres.length > 0 ? cadres[0] : null,
      };
    });
  }

  async findOne(id: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const decoded = decodeURIComponent(id).trim();
    const enTranslated = translateOrgUnitNameToEnglish(decoded);
    const targetName = enTranslated || decoded;
    const normalized = targetName.toLowerCase().replace(/-/g, ' ');
    const where: any = isUuid
      ? { id }
      : {
          OR: [
            { name: { equals: decoded, mode: 'insensitive' as const } },
            { name: { equals: normalized, mode: 'insensitive' as const } },
            { name: { equals: `${normalized} union`, mode: 'insensitive' as const } },
            { name: { equals: normalized.replace(/\s*union\s*$/i, ''), mode: 'insensitive' as const } },
            ...(enTranslated
              ? [
                  { name: { equals: enTranslated, mode: 'insensitive' as const } },
                  { name: { equals: `${enTranslated} union`, mode: 'insensitive' as const } },
                ]
              : []),
          ],
        };

    let union = await this.prisma.union.findFirst({
      where,
      include: {
        district: true,
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
            cadres: true,
            panchayats: true,
          },
        },
        panchayats: {
          include: {
            villages: true,
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
        },
      },
    });

    if (!union && !isUuid) {
      const allUnions = await this.prisma.union.findMany({
        include: {
          district: true,
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
              cadres: true,
              panchayats: true,
            },
          },
          panchayats: {
            include: {
              villages: true,
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
          },
        },
      });

      union =
        allUnions.find((u) => {
          const uSlug = u.name.toLowerCase().replace(/\s*union\s*$/i, '').trim().replace(/[\s\-_.]+/g, '-').replace(/[^a-z0-9\-]/g, '');
          const targetSlug = targetName.toLowerCase().replace(/\s*union\s*$/i, '').trim().replace(/[\s\-_.]+/g, '-').replace(/[^a-z0-9\-]/g, '');
          if (uSlug && targetSlug && uSlug === targetSlug) return true;
          const trans = u.translations as any;
          if (trans?.ta?.name && trans.ta.name.trim() === decoded) return true;
          if (translateOrgUnitNameToTamil(u.name).trim() === decoded) return true;
          return false;
        }) || null;

      if (!union && (decoded === '-' || !decoded || decoded === 'undefined')) {
        union = allUnions[0] || null;
      }
    }

    if (!union) {
      return null;
    }

    const totalBooths = await this.prisma.booth.count({
      where: {
        kilais: {
          some: {
            unionId: union.id,
          },
        },
      },
    });

    const unionCadres = await this.prisma.cadre.findMany({
      where: {
        unionId: union.id,
        level: 'UNION',
      },
      include: {
        officeBearerRoles: true,
        wing: true,
        district: true,
        union: true,
      },
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

    unionCadres.sort((a, b) => {
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
      ...union,
      totalBooths,
      unionCadres,
    };
  }

  async update(id: string, updateUnionDto: UpdateUnionDto) {
    let targetId = id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      const u = await this.findOne(id);
      if (u) targetId = u.id;
    }

    const data: any = { ...updateUnionDto };

    if (data.name && typeof data.name === 'string') {
      const existing = await this.prisma.union.findUnique({
        where: { id: targetId },
        select: { translations: true },
      });
      const currentTranslations = (existing?.translations as any) || {};
      const taName = translateOrgUnitNameToTamil(data.name);
      data.translations = {
        ...currentTranslations,
        ...(data.translations || {}),
        ta: {
          ...(currentTranslations.ta || {}),
          ...(data.translations?.ta || {}),
          name: taName,
        },
      };
    }

    if (data.areasCovered && Array.isArray(data.areasCovered)) {
      const existing = await this.prisma.union.findUnique({
        where: { id: targetId },
        select: { translations: true },
      });
      const currentTranslations = (existing?.translations as any) || {};
      const taAreas = data.areasCovered.map((a: string) => translateAreaToTamil(a));
      data.translations = {
        ...currentTranslations,
        ...(data.translations || {}),
        ta: {
          ...(currentTranslations.ta || {}),
          ...(data.translations?.ta || {}),
          areasCovered: taAreas,
        },
      };
    }

    if (data.contactName && typeof data.contactName === 'string') {
      const existing = await this.prisma.union.findUnique({
        where: { id: targetId },
        select: { translations: true },
      });
      const currentTranslations = (existing?.translations as any) || {};
      const taContact = translatePersonNameToTamil(data.contactName);
      data.translations = {
        ...currentTranslations,
        ...(data.translations || {}),
        ta: {
          ...(currentTranslations.ta || {}),
          ...(data.translations?.ta || {}),
          contactName: taContact,
        },
      };
    }

    return this.prisma.union.update({
      where: { id: targetId },
      data: data as any,
    });
  }

  async remove(id: string) {
    let targetId = id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      const u = await this.findOne(id);
      if (u) targetId = u.id;
    }
    return this.prisma.union.delete({ where: { id: targetId } });
  }
}
