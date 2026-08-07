import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoothDto } from './dto/create-booth.dto';
import { UpdateBoothDto } from './dto/update-booth.dto';

@Injectable()
export class BoothsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.booth.findMany({
      include: {
        kilais: true,
        agents: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
