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

  @Post('swap')
  @ApiOperation({ summary: 'Swap assignments and roles between two cadres' })
  swap(@Body() payload: { cadreAId: string; cadreBId: string; roleA?: string; roleB?: string; swapAssignments?: boolean }) {
    return this.cadreService.swap(payload);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move a cadre to a new assignment or role' })
  move(@Param('id') id: string, @Body() payload: any) {
    return this.cadreService.move(id, payload);
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

  @Patch('reorder-positions')
  @ApiOperation({ summary: 'Reorder positions for Executive Committee members' })
  reorderPositions(@Body() payload: { items?: { id: string; position: number }[]; cadreIds?: string[] }) {
    return this.cadreService.reorderPositions(payload);
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
