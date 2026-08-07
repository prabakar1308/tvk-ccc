import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UnionsService } from './unions.service';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';

@ApiTags('Unions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('unions')
export class UnionsController {
  constructor(private readonly unionsService: UnionsService) {}

  @Post()
  create(@Body() createUnionDto: CreateUnionDto) {
    return this.unionsService.create(createUnionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Unions' })
  findAll() {
    return this.unionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUnionDto: UpdateUnionDto) {
    return this.unionsService.update(id, updateUnionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unionsService.remove(id);
  }
}
