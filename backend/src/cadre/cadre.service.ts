import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CadreLevel } from '@prisma/client';

@Injectable()
export class CadreService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: any) {
    return this.prisma.cadre.create({
      data: payload,
    });
  }

  async createBulk(payloads: any[]) {
    const aadhaars = payloads.map(p => p.aadhaarNumber).filter(Boolean);
    const memberIds = payloads.map(p => p.memberId).filter(Boolean);
    const voterIds = payloads.map(p => p.voterId).filter(Boolean);

    if (aadhaars.length > 0) {
      const existingAadhaars = await this.prisma.cadre.findMany({
        where: { aadhaarNumber: { in: aadhaars } },
        select: { aadhaarNumber: true }
      });
      if (existingAadhaars.length > 0) {
        throw new BadRequestException(`Duplicate Aadhaar Numbers found: ${existingAadhaars.map(c => c.aadhaarNumber).join(', ')}`);
      }
    }

    if (memberIds.length > 0) {
      const existingMemberIds = await this.prisma.cadre.findMany({
        where: { memberId: { in: memberIds } },
        select: { memberId: true }
      });
      if (existingMemberIds.length > 0) {
        throw new BadRequestException(`Duplicate Member IDs found: ${existingMemberIds.map(c => c.memberId).join(', ')}`);
      }
    }

    if (voterIds.length > 0) {
      const existingVoterIds = await this.prisma.cadre.findMany({
        where: { voterId: { in: voterIds } },
        select: { voterId: true }
      });
      if (existingVoterIds.length > 0) {
        throw new BadRequestException(`Duplicate Voter IDs found: ${existingVoterIds.map(c => c.voterId).join(', ')}`);
      }
    }

    const result = await this.prisma.cadre.createMany({
      data: payloads,
    });

    return { message: 'Cadres imported successfully', count: result.count };
  }


  findAll(query: any) {
    const { level, districtId, districtGroup, unionId, kilaiId, search } = query;
    const where: any = {};
    
    if (level) where.level = level;
    if (districtId) where.districtId = districtId;
    if (districtGroup) where.districtGroup = districtGroup;
    if (unionId) where.unionId = unionId;
    if (kilaiId) where.kilaiId = kilaiId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    return this.prisma.cadre.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const cadre = await this.prisma.cadre.findUnique({
      where: { id },
      include: {
        district: true,
        union: true,
        homeKilai: true,
        officeBearerRoles: true,
      },
    });
    if (!cadre) throw new NotFoundException('Cadre not found');
    return cadre;
  }

  async update(id: string, payload: any) {
    const cadre = await this.prisma.cadre.findUnique({ where: { id } });
    if (!cadre) throw new NotFoundException('Cadre not found');
    
    return this.prisma.cadre.update({
      where: { id },
      data: payload,
    });
  }

  async remove(id: string) {
    const cadre = await this.prisma.cadre.findUnique({ where: { id } });
    if (!cadre) throw new NotFoundException('Cadre not found');
    
    return this.prisma.cadre.delete({ where: { id } });
  }
}
