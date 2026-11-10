import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('elections')
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.electionsService.findAll();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  findCurrent() {
    return this.electionsService.findCurrent();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.electionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createElectionDto: CreateElectionDto) {
    return this.electionsService.create(createElectionDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateElectionDto: UpdateElectionDto,
  ) {
    return this.electionsService.update(id, updateElectionDto);
  }

  @Post(':id/set-current')
  @UseGuards(JwtAuthGuard)
  setCurrent(@Param('id') id: string) {
    return this.electionsService.setCurrent(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.electionsService.remove(id);
  }
}

