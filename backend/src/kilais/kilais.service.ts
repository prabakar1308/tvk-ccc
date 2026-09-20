import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKilaiDto } from './dto/create-kilai.dto';
import { UpdateKilaiDto } from './dto/update-kilai.dto';

@Injectable()
export class KilaisService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createKilaiDto: CreateKilaiDto) {
    const { linkedBooths, ...data } = createKilaiDto;
    const createData: any = { ...data };
    
    if (linkedBooths && linkedBooths.length > 0) {
      createData.booths = {
        connect: linkedBooths.map((id: string) => ({ id }))
      };
    }

    return this.prisma.kilai.create({
      data: createData,
    });
  }

  async findAll(unionId?: string) {
    const where = unionId ? { unionId } : {};
    return this.prisma.kilai.findMany({
      where,
      include: {
        union: true,
        booths: true,
        _count: {
          select: {
            cadres: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const kilai = await this.prisma.kilai.findUnique({
      where: { id },
      include: {
        union: true,
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

    return kilai;
  }

  async update(id: string, updateKilaiDto: UpdateKilaiDto) {
    const kilai = await this.prisma.kilai.findUnique({ where: { id } });
    if (!kilai) {
      throw new NotFoundException(`Kilai with ID ${id} not found`);
    }

    const { linkedBooths, ...data } = updateKilaiDto;
    const updateData: any = { ...data };
    
    if (linkedBooths !== undefined) {
      updateData.booths = {
        set: linkedBooths.map((id: string) => ({ id }))
      };
    }

    return this.prisma.kilai.update({
      where: { id },
      data: updateData,
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

      if (!existingBearer) throw new NotFoundException('Office Bearer not found');

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
