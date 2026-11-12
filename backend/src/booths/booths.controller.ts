import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BoothsService } from './booths.service';
import { CreateBoothDto } from './dto/create-booth.dto';
import { UpdateBoothDto } from './dto/update-booth.dto';
import { CreateBoothElectionResultDto } from './dto/create-booth-election-result.dto';
import { BulkUpdateBoothDemographicsDto } from './dto/update-demographics.dto';
import { BulkUpdateBoothElectionResultsDto } from './dto/update-election-results.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('booths')
@UseGuards(JwtAuthGuard)
export class BoothsController {
  constructor(private readonly boothsService: BoothsService) {}

  @Post()
  create(@Body() createBoothDto: CreateBoothDto) {
    return this.boothsService.create(createBoothDto);
  }

  @Post('bulk-demographics')
  updateDemographicsBulk(@Body() dto: BulkUpdateBoothDemographicsDto) {
    return this.boothsService.updateDemographicsBulk(dto);
  }

  @Post('bulk-election-results')
  updateElectionResultsBulk(@Body() dto: BulkUpdateBoothElectionResultsDto) {
    return this.boothsService.updateElectionResultsBulk(dto);
  }

  @Get()
  findAll(
    @Query('unionId') unionId?: string,
    @Query('panchayatId') panchayatId?: string,
    @Query('villageId') villageId?: string,
  ) {
    return this.boothsService.findAll(unionId, panchayatId, villageId);
  }

  @Get('areas')
  getDistinctAreas() {
    return this.boothsService.getDistinctAreas();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boothsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoothDto: UpdateBoothDto) {
    return this.boothsService.update(id, updateBoothDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boothsService.remove(id);
  }

  @Post(':id/election-results')
  addElectionResult(
    @Param('id') id: string,
    @Body() dto: CreateBoothElectionResultDto,
  ) {
    return this.boothsService.addElectionResult(id, dto);
  }

  @Patch(':id/election-results/:resultId')
  updateElectionResult(
    @Param('id') id: string,
    @Param('resultId') resultId: string,
    @Body() dto: Partial<CreateBoothElectionResultDto>,
  ) {
    return this.boothsService.updateElectionResult(id, resultId, dto);
  }

  @Delete(':id/election-results/:resultId')
  removeElectionResult(
    @Param('id') id: string,
    @Param('resultId') resultId: string,
  ) {
    return this.boothsService.removeElectionResult(id, resultId);
  }

  // --- Booth Agent Assignments per Election ---

  @Get(':id/elections/:electionId/agents')
  getElectionAgents(
    @Param('id') id: string,
    @Param('electionId') electionId: string,
  ) {
    return this.boothsService.getElectionAgents(id, electionId);
  }

  @Post(':id/elections/:electionId/agents')
  assignElectionAgents(
    @Param('id') id: string,
    @Param('electionId') electionId: string,
    @Body()
    body: {
      cadreIds?: string[];
      agents?: Array<{
        cadreId: string;
        role?: string;
        blaFormUrl?: string | null;
        notes?: string;
      }>;
      role?: string;
    },
  ) {
    const list =
      body.agents && body.agents.length > 0
        ? body.agents
        : body.cadreIds || [];
    return this.boothsService.assignElectionAgents(
      id,
      electionId,
      list,
      body.role,
    );
  }

  @Post(':id/elections/:electionId/agents/single')
  addElectionAgent(
    @Param('id') id: string,
    @Param('electionId') electionId: string,
    @Body()
    body: {
      cadreId: string;
      role?: string;
      blaFormUrl?: string | null;
      notes?: string;
    },
  ) {
    return this.boothsService.addElectionAgent(
      id,
      electionId,
      body.cadreId,
      body.role,
      body.blaFormUrl,
      body.notes,
    );
  }

  @Patch(':id/elections/:electionId/agents/:cadreId')
  updateElectionAgent(
    @Param('id') id: string,
    @Param('electionId') electionId: string,
    @Param('cadreId') cadreId: string,
    @Body()
    body: {
      role?: string;
      blaFormUrl?: string | null;
      notes?: string;
      newCadreId?: string;
    },
  ) {
    return this.boothsService.updateElectionAgent(
      id,
      electionId,
      cadreId,
      body,
    );
  }

  @Delete(':id/elections/:electionId/agents/:cadreId')
  removeElectionAgent(
    @Param('id') id: string,
    @Param('electionId') electionId: string,
    @Param('cadreId') cadreId: string,
  ) {
    return this.boothsService.removeElectionAgent(id, electionId, cadreId);
  }
}
