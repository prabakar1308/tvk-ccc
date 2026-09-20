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
      }
    });
    return booths.map(b => b.area).filter(a => a && a.trim() !== '') as string[];
  }

  async create(createBoothDto: CreateBoothDto) {
    const { kilaiIds, agentIds, ...boothData } = createBoothDto;
    
    return this.prisma.booth.create({
      data: {
        ...boothData,
        kilais: kilaiIds ? {
          connect: kilaiIds.map(id => ({ id }))
        } : undefined,
        agents: agentIds ? {
          connect: agentIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        kilais: true,
        agents: true,
      }
    });
  }

  async findAll() {
    const booths = await this.prisma.booth.findMany({
      include: {
        kilais: true,
        agents: true,
      },
    });
    
    // Use natural alphanumeric sorting so "10" comes after "2"
    return booths.sort((a, b) => a.boothNo.localeCompare(b.boothNo, undefined, { numeric: true }));
  }

  async findOne(id: string) {
    const booth = await this.prisma.booth.findUnique({
      where: { id },
      include: {
        kilais: true,
        agents: true,
      }
    });

    if (!booth) {
      throw new NotFoundException(`Booth with ID ${id} not found`);
    }

    return booth;
  }

  async update(id: string, updateBoothDto: UpdateBoothDto) {
    const { kilaiIds, agentIds, ...boothData } = updateBoothDto;

    // Check if booth exists
    await this.findOne(id);

    return this.prisma.booth.update({
      where: { id },
      data: {
        ...boothData,
        kilais: kilaiIds ? {
          set: kilaiIds.map(id => ({ id }))
        } : undefined,
        agents: agentIds ? {
          set: agentIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        kilais: true,
        agents: true,
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.booth.delete({
      where: { id },
    });
  }
}
