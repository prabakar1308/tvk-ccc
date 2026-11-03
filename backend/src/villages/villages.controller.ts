import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VillagesService } from './villages.service';
import { CreateVillageDto } from './dto/create-village.dto';
import { UpdateVillageDto } from './dto/update-village.dto';

@ApiTags('Villages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('villages')
export class VillagesController {
  constructor(private readonly villagesService: VillagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all villages' })
  findAll(
    @Query('panchayatId') panchayatId?: string,
    @Query('search') search?: string,
  ) {
    return this.villagesService.findAll(panchayatId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get village details by ID or code' })
  findOne(@Param('id') id: string) {
    return this.villagesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new village' })
  create(@Body() createVillageDto: CreateVillageDto) {
    return this.villagesService.create(createVillageDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update village details' })
  update(
    @Param('id') id: string,
    @Body() updateVillageDto: UpdateVillageDto,
  ) {
    return this.villagesService.update(id, updateVillageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a village' })
  remove(@Param('id') id: string) {
    return this.villagesService.remove(id);
  }
}
