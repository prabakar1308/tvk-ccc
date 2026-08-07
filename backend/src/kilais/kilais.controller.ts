import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { KilaisService } from './kilais.service';
import { CreateKilaiDto } from './dto/create-kilai.dto';
import { UpdateKilaiDto } from './dto/update-kilai.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Kilais')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kilais')
export class KilaisController {
  constructor(private readonly kilaisService: KilaisService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Kilai' })
  create(@Req() req: any, @Body() createKilaiDto: CreateKilaiDto) {
    if (req.user.role !== 'SUPER_ADMIN') {
      if (!req.user.unionId) throw new ForbiddenException('User is not assigned to a union');
      createKilaiDto.unionId = req.user.unionId;
    } else {
      // Super admin can provide unionId in dto, or header. If missing, throw error
      if (!createKilaiDto.unionId) {
        const headerUnionId = req.headers['x-active-union-id'];
        if (headerUnionId) createKilaiDto.unionId = headerUnionId as string;
        else throw new ForbiddenException('unionId is required for SUPER_ADMIN');
      }
    }
    return this.kilaisService.create(createKilaiDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Kilais' })
  @ApiQuery({ name: 'unionId', required: false, type: String })
  findAll(@Req() req: any, @Query('unionId') unionId?: string) {
    let targetUnionId = unionId;
    if (req.user.role !== 'SUPER_ADMIN') {
      targetUnionId = req.user.unionId;
    } else if (!targetUnionId) {
      const headerUnionId = req.headers['x-active-union-id'];
      if (headerUnionId) targetUnionId = headerUnionId as string;
    }
    return this.kilaisService.findAll(targetUnionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Kilai by ID' })
  findOne(@Param('id') id: string) {
    return this.kilaisService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Kilai by ID' })
  update(@Param('id') id: string, @Body() updateKilaiDto: UpdateKilaiDto) {
    return this.kilaisService.update(id, updateKilaiDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive/Soft delete Kilai by ID' })
  remove(@Param('id') id: string) {
    return this.kilaisService.remove(id);
  }

  @Get(':id/office-bearers')
  @ApiOperation({ summary: 'Get Office Bearers of a Kilai' })
  getOfficeBearers(@Param('id') id: string) {
    return this.kilaisService.getOfficeBearers(id);
  }

  @Post(':id/office-bearers')
  @ApiOperation({ summary: 'Add an Office Bearer to a Kilai' })
  addOfficeBearer(@Param('id') id: string, @Body() payload: any) {
    return this.kilaisService.addOfficeBearer(id, payload);
  }

  @Patch(':id/office-bearers/:bearerId')
  @ApiOperation({ summary: 'Update an Office Bearer' })
  updateOfficeBearer(@Param('id') id: string, @Param('bearerId') bearerId: string, @Body() payload: any) {
    return this.kilaisService.updateOfficeBearer(id, bearerId, payload);
  }

  @Delete(':id/office-bearers/:bearerId')
  @ApiOperation({ summary: 'Remove an Office Bearer' })
  removeOfficeBearer(@Param('id') id: string, @Param('bearerId') bearerId: string) {
    return this.kilaisService.removeOfficeBearer(id, bearerId);
  }

}
