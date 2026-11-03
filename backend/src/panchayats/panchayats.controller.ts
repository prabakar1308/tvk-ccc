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
import { PanchayatsService } from './panchayats.service';
import { CreatePanchayatDto } from './dto/create-panchayat.dto';
import { UpdatePanchayatDto } from './dto/update-panchayat.dto';
import { UpdatePanchayatGeoDto } from './dto/update-geo.dto';

@ApiTags('Panchayats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('panchayats')
export class PanchayatsController {
  constructor(private readonly panchayatsService: PanchayatsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all panchayats or wards' })
  findAll(
    @Query('unionId') unionId?: string,
    @Query('search') search?: string,
  ) {
    return this.panchayatsService.findAll(unionId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get panchayat details by ID or code/slug' })
  findOne(@Param('id') id: string) {
    return this.panchayatsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new panchayat or ward' })
  create(@Body() createPanchayatDto: CreatePanchayatDto) {
    return this.panchayatsService.create(createPanchayatDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update panchayat details' })
  update(
    @Param('id') id: string,
    @Body() updatePanchayatDto: UpdatePanchayatDto,
  ) {
    return this.panchayatsService.update(id, updatePanchayatDto);
  }

  @Patch(':id/geo')
  @ApiOperation({ summary: 'Update panchayat geographic center and boundary coordinates' })
  updateGeo(
    @Param('id') id: string,
    @Body() updateGeoDto: UpdatePanchayatGeoDto,
  ) {
    return this.panchayatsService.updateGeo(id, updateGeoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a panchayat' })
  remove(@Param('id') id: string) {
    return this.panchayatsService.remove(id);
  }
}
