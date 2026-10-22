import { Injectable } from '@nestjs/common';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';
import { PrismaService } from '../prisma/prisma.service';
import { translateAreaToTamil, getMasterAreas } from '../i18n/area-translations';
import { translatePersonNameToTamil } from '../i18n/name-translations';
import { translateOrgUnitNameToTamil } from '../i18n/org-unit-translations';

@Injectable()
export class UnionsService {
  constructor(private readonly prisma: PrismaService) {}

  getMasterAreas() {
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
    const union = await this.prisma.union.findUnique({
      where: { id },
      include: {
        district: true,
        _count: {
          select: {
            kilais: true,
            cadres: true,
          },
        },
      },
    });

    if (!union) {
      return null;
    }

    const totalBooths = await this.prisma.booth.count({
      where: {
        kilais: {
          some: {
            unionId: id,
          },
        },
      },
    });

    const unionCadres = await this.prisma.cadre.findMany({
      where: {
        unionId: id,
        level: 'UNION',
      },
      include: {
        officeBearerRoles: true,
      },
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

    unionCadres.sort((a, b) => {
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
      ...union,
      totalBooths,
      unionCadres,
    };
  }

  async update(id: string, updateUnionDto: UpdateUnionDto) {
    const data: any = { ...updateUnionDto };

    if (data.name && typeof data.name === 'string') {
      const existing = await this.prisma.union.findUnique({
        where: { id },
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
        where: { id },
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
        where: { id },
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
      where: { id },
      data: data as any,
    });
  }

  remove(id: string) {
    return this.prisma.union.delete({ where: { id } });
  }
}
