import { Injectable } from '@nestjs/common';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistrictService {
  constructor(private prisma: PrismaService) {}

  create(createDistrictDto: CreateDistrictDto) {
    return this.prisma.district.create({
      data: createDistrictDto as any,
    });
  }

  findAll() {
    return this.prisma.district.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: string) {
    return this.prisma.district.findUnique({ where: { id } });
  }

  update(id: string, updateDistrictDto: UpdateDistrictDto) {
    return this.prisma.district.update({
      where: { id },
      data: updateDistrictDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.district.delete({ where: { id } });
  }
}
