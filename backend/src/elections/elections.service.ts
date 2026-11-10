import { Injectable, OnModuleInit, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

const DEFAULT_ELECTIONS = [
  {
    name: '2026 Tamil Nadu Legislative Assembly Election',
    nameTa: '2026 தமிழ்நாடு சட்டமன்றப் பொதுத்தேர்தல்',
    year: '2026',
    type: 'ASSEMBLY',
    isCurrent: true,
    status: 'UPCOMING',
    description: 'Upcoming 2026 Tamil Nadu Legislative Assembly Election for 234 constituencies.',
  },
  {
    name: '2024 Parliamentary Election',
    nameTa: '2024 பாராளுமன்றப் பொதுத்தேர்தல்',
    year: '2024',
    type: 'PARLIAMENTARY',
    isCurrent: false,
    status: 'COMPLETED',
    description: '18th Lok Sabha General Election 2024.',
  },
  {
    name: '2021 Tamil Nadu Legislative Assembly Election',
    nameTa: '2021 தமிழ்நாடு சட்டமன்றப் பொதுத்தேர்தல்',
    year: '2021',
    type: 'ASSEMBLY',
    isCurrent: false,
    status: 'COMPLETED',
    description: '16th Tamil Nadu Legislative Assembly Election.',
  },
  {
    name: '2019 Parliamentary Election',
    nameTa: '2019 பாராளுமன்றப் பொதுத்தேர்தல்',
    year: '2019',
    type: 'PARLIAMENTARY',
    isCurrent: false,
    status: 'COMPLETED',
    description: '17th Lok Sabha General Election 2019.',
  },
  {
    name: '2016 Tamil Nadu Legislative Assembly Election',
    nameTa: '2016 தமிழ்நாடு சட்டமன்றப் பொதுத்தேர்தல்',
    year: '2016',
    type: 'ASSEMBLY',
    isCurrent: false,
    status: 'COMPLETED',
    description: '15th Tamil Nadu Legislative Assembly Election.',
  },
];

@Injectable()
export class ElectionsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultElections();
  }

  private async seedDefaultElections() {
    try {
      const count = await this.prisma.election.count();
      if (count === 0) {
        for (const election of DEFAULT_ELECTIONS) {
          await this.prisma.election.create({
            data: election,
          });
        }
      }
    } catch (error) {
      // Ignore if database is not reachable yet during cold starts
    }
  }

  async findAll() {
    return this.prisma.election.findMany({
      include: {
        _count: {
          select: {
            electionResults: true,
            agentAssignments: true,
          },
        },
      },
      orderBy: [
        { isCurrent: 'desc' },
        { year: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findCurrent() {
    const current = await this.prisma.election.findFirst({
      where: { isCurrent: true },
      include: {
        _count: {
          select: {
            electionResults: true,
            agentAssignments: true,
          },
        },
      },
    });

    if (current) return current;

    // Fallback to highest year
    return this.prisma.election.findFirst({
      orderBy: { year: 'desc' },
      include: {
        _count: {
          select: {
            electionResults: true,
            agentAssignments: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const election = await this.prisma.election.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            electionResults: true,
            agentAssignments: true,
          },
        },
      },
    });

    if (!election) {
      throw new NotFoundException(`Election with ID ${id} not found`);
    }

    return election;
  }

  async create(createElectionDto: CreateElectionDto) {
    if (createElectionDto.isCurrent) {
      await this.prisma.election.updateMany({
        data: { isCurrent: false },
      });
    }

    try {
      return await this.prisma.election.create({
        data: {
          name: createElectionDto.name,
          nameTa: createElectionDto.nameTa,
          year: createElectionDto.year,
          type: createElectionDto.type || 'ASSEMBLY',
          date: createElectionDto.date ? new Date(createElectionDto.date) : null,
          isCurrent: Boolean(createElectionDto.isCurrent),
          status: createElectionDto.status || 'UPCOMING',
          description: createElectionDto.description,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException(
          `An election with year "${createElectionDto.year}" and name "${createElectionDto.name}" already exists.`,
        );
      }
      throw err;
    }
  }

  async update(id: string, updateElectionDto: UpdateElectionDto) {
    await this.findOne(id);

    if (updateElectionDto.isCurrent) {
      await this.prisma.election.updateMany({
        where: { id: { not: id } },
        data: { isCurrent: false },
      });
    }

    const data: any = { ...updateElectionDto };
    if (updateElectionDto.date) {
      data.date = new Date(updateElectionDto.date);
    }

    return this.prisma.election.update({
      where: { id },
      data,
    });
  }

  async setCurrent(id: string) {
    await this.findOne(id);

    // Unset all others
    await this.prisma.election.updateMany({
      where: { id: { not: id } },
      data: { isCurrent: false },
    });

    return this.prisma.election.update({
      where: { id },
      data: { isCurrent: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.election.delete({
      where: { id },
    });
  }
}

