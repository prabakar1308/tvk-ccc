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

  findOne(id: string) {
    return this.prisma.union.findUnique({
      where: { id },
      include: { district: true },
    });
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
