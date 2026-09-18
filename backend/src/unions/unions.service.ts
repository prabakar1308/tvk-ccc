import { Injectable } from '@nestjs/common';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnionsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createUnionDto: CreateUnionDto) {
    return this.prisma.union.create({
      data: createUnionDto as any,
    });
  }

  findAll() {
    return this.prisma.union.findMany({
      include: { district: true },
      orderBy: { name: 'asc' },
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
            cadres: true
          }
        }
      },
    });

    if (!union) {
      return null;
    }

    const totalBooths = await this.prisma.booth.count({
      where: {
        kilais: {
          some: {
            unionId: id
          }
        }
      }
    });

    const unionCadres = await this.prisma.cadre.findMany({
      where: {
        unionId: id,
        level: 'UNION'
      },
      include: {
        officeBearerRoles: true
      }
    });

    return {
      ...union,
      totalBooths,
      unionCadres
    };
  }

  update(id: string, updateUnionDto: UpdateUnionDto) {
    return this.prisma.union.update({
      where: { id },
      data: updateUnionDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.union.delete({ where: { id } });
  }
}
