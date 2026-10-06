import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { WingsService } from './wings.service';
import { AssignWingMemberDto } from './dto/assign-wing-member.dto';
import { CadreLevel } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const WINGS_DATA = [
  { name: 'Information Technology Wing', iconName: 'Monitor', color: 'bg-blue-500', textColor: 'text-blue-500' },
  { name: 'Advocate / Legal Wing', iconName: 'Scale', color: 'bg-slate-700', textColor: 'text-slate-700' },
  { name: 'Media Wing', iconName: 'Radio', color: 'bg-red-500', textColor: 'text-red-500' },
  { name: 'Speakers Wing', iconName: 'Mic', color: 'bg-orange-500', textColor: 'text-orange-500' },
  { name: 'Training & Cadre Development Wing', iconName: 'GraduationCap', color: 'bg-indigo-500', textColor: 'text-indigo-500' },
  { name: 'Membership Enrolment Wing', iconName: 'Users', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
  { name: 'Climate Research & Environment Wing', iconName: 'TreePine', color: 'bg-green-600', textColor: 'text-green-600' },
  { name: 'Historic Data Research & Factcheck Wing', iconName: 'History', color: 'bg-amber-600', textColor: 'text-amber-600' },
  { name: 'Transgenders Wing', iconName: 'Rainbow', color: 'bg-fuchsia-500', textColor: 'text-fuchsia-500' },
  { name: 'Differently Abled Wing', iconName: 'HeartHandshake', color: 'bg-teal-500', textColor: 'text-teal-500' },
  { name: 'Youth Wing', iconName: 'Zap', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  { name: 'Students Wing', iconName: 'BookOpen', color: 'bg-sky-500', textColor: 'text-sky-500' },
  { name: 'Women Wing', iconName: 'UserRound', color: 'bg-pink-500', textColor: 'text-pink-500' },
  { name: 'Young Women Wing', iconName: 'UserPlus', color: 'bg-rose-400', textColor: 'text-rose-400' },
  { name: 'Children Wing', iconName: 'Baby', color: 'bg-lime-500', textColor: 'text-lime-500' },
  { name: 'Cadre Wing', iconName: 'Shield', color: 'bg-slate-600', textColor: 'text-slate-600' },
  { name: 'Traders Wing', iconName: 'Store', color: 'bg-violet-500', textColor: 'text-violet-500' },
  { name: 'Fishermen Wing', iconName: 'Sailboat', color: 'bg-cyan-500', textColor: 'text-cyan-500' },
  { name: 'Weavers Wing', iconName: 'Scissors', color: 'bg-purple-500', textColor: 'text-purple-500' },
  { name: 'Retired Govt Employees Wing', iconName: 'Briefcase', color: 'bg-stone-500', textColor: 'text-stone-500' },
  { name: 'Labourers Wing', iconName: 'HardHat', color: 'bg-amber-700', textColor: 'text-amber-700' },
  { name: 'Entrepreneurs Wing', iconName: 'Lightbulb', color: 'bg-yellow-600', textColor: 'text-yellow-600' },
  { name: 'Non-Resident of India Wing', iconName: 'Globe', color: 'bg-blue-600', textColor: 'text-blue-600' },
  { name: 'Doctors Wing', iconName: 'Stethoscope', color: 'bg-red-400', textColor: 'text-red-400' },
  { name: 'Farmers Wing', iconName: 'Wheat', color: 'bg-green-500', textColor: 'text-green-500' },
  { name: 'Art, Culture & Tradition Wing', iconName: 'Palette', color: 'bg-fuchsia-600', textColor: 'text-fuchsia-600' },
  { name: 'Volunteers Wing (Thondar Ani)', iconName: 'HandHeart', color: 'bg-rose-500', textColor: 'text-rose-500' },
  { name: 'AITVMI – All India TV Makkal Iyakkam', iconName: 'Tv', color: 'bg-indigo-600', textColor: 'text-indigo-600' },
];

@Controller('wings')
export class WingsController {
  constructor(private readonly wingsService: WingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('level') level?: CadreLevel,
    @Query('districtId') districtId?: string,
    @Query('unionId') unionId?: string,
  ) {
    return this.wingsService.findAll(level, districtId, unionId);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  findMembers(
    @Param('id') wingId: string,
    @Query('level') level: CadreLevel,
    @Query('districtId') districtId?: string,
    @Query('unionId') unionId?: string,
  ) {
    return this.wingsService.findMembers(wingId, level, districtId, unionId);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  assignMember(
    @Param('id') wingId: string,
    @Body() assignDto: AssignWingMemberDto,
  ) {
    return this.wingsService.assignMember(wingId, assignDto);
  }

  @Delete('members/:cadreId')
  @UseGuards(JwtAuthGuard)
  removeMember(@Param('cadreId') cadreId: string) {
    return this.wingsService.removeMember(cadreId);
  }

  @Post('seed')
  async seedWings() {
    return this.wingsService.seedWings(WINGS_DATA);
  }
}
