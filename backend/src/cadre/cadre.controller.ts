import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CadreService } from './cadre.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Cadres')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cadres')
export class CadreController {
  constructor(private readonly cadreService: CadreService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cadre' })
  create(@Body() payload: any) {
    return this.cadreService.create(payload);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple cadres in bulk' })
  createBulk(@Body() payload: any[]) {
    return this.cadreService.createBulk(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Get cadres based on filters' })
  findAll(@Query() query: any) {
    return this.cadreService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cadre details' })
  findOne(@Param('id') id: string) {
    return this.cadreService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cadre' })
  update(@Param('id') id: string, @Body() payload: any) {
    return this.cadreService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cadre' })
  remove(@Param('id') id: string) {
    return this.cadreService.remove(id);
  }
}
