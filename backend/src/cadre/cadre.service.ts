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
    const phones = payloads.map(p => p.phone).filter(Boolean);
    const voterIds = payloads.map(p => p.voterId).filter(Boolean);

    const orConditions: any[] = [];
    if (aadhaars.length > 0) orConditions.push({ aadhaarNumber: { in: aadhaars } });
    if (phones.length > 0) orConditions.push({ phone: { in: phones } });
    if (voterIds.length > 0) orConditions.push({ voterId: { in: voterIds } });

    if (orConditions.length > 0) {
      const existingRecords = await this.prisma.cadre.findMany({
        where: { OR: orConditions },
        select: { name: true, phone: true, aadhaarNumber: true, voterId: true, level: true, unionId: true, homeKilaiId: true }
      });

      if (existingRecords.length > 0) {
        const duplicates = [];
        
        for (const payload of payloads) {
          const matching = existingRecords.find(r => 
            (payload.phone && r.phone === payload.phone) || 
            (payload.aadhaarNumber && r.aadhaarNumber === payload.aadhaarNumber) || 
            (payload.voterId && r.voterId === payload.voterId)
          );
          
          if (matching) {
            let reason = [];
            if (payload.phone && matching.phone === payload.phone) reason.push('Phone');
            if (payload.aadhaarNumber && matching.aadhaarNumber === payload.aadhaarNumber) reason.push('Aadhaar');
            if (payload.voterId && matching.voterId === payload.voterId) reason.push('Voter ID');
            
            duplicates.push({
              name: payload.name || 'Unknown',
              phone: payload.phone || '-',
              aadhaarNumber: payload.aadhaarNumber || '-',
              voterId: payload.voterId || '-',
              reason: `${reason.join(', ')} already exists`
            });
          }
        }

        if (duplicates.length > 0) {
          throw new BadRequestException({ message: 'Duplicate records found', duplicates });
        }
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
