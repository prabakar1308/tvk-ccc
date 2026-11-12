import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoothDto } from './dto/create-booth.dto';
import { UpdateBoothDto } from './dto/update-booth.dto';
import { CreateBoothElectionResultDto } from './dto/create-booth-election-result.dto';
import { BulkUpdateBoothDemographicsDto } from './dto/update-demographics.dto';
import { BulkUpdateBoothElectionResultsDto } from './dto/update-election-results.dto';

@Injectable()
export class BoothsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDistinctAreas() {
    const booths = await this.prisma.booth.findMany({
      select: { area: true },
      distinct: ['area'],
      where: {
        area: {
          not: null,
        },
      },
      orderBy: {
        area: 'asc',
      },
    });
    return booths
      .map((b) => b.area)
      .filter((a) => a && a.trim() !== '') as string[];
  }

  async updateDemographicsBulk(dto: BulkUpdateBoothDemographicsDto) {
    const list = dto?.demographics || [];
    if (!Array.isArray(list) || list.length === 0) {
      throw new BadRequestException('No demographics data provided');
    }

    // Clean and normalize booth numbers
    const normalized = list
      .map((item) => {
        const rawNo = String(item.boothNo ?? '').trim();
        const cleanNo = rawNo.replace(/^#/, '').trim();
        const male = Math.max(0, parseInt(String(item.maleCount ?? 0), 10) || 0);
        const female = Math.max(0, parseInt(String(item.femaleCount ?? 0), 10) || 0);
        const third = Math.max(0, parseInt(String(item.thirdGenderCount ?? 0), 10) || 0);
        const providedTotal =
          item.totalCount !== undefined &&
          item.totalCount !== null &&
          String(item.totalCount).trim() !== ''
            ? parseInt(String(item.totalCount), 10)
            : null;
        const total =
          providedTotal !== null && !isNaN(providedTotal) && providedTotal > 0
            ? providedTotal
            : male + female + third;

        return {
          boothNo: cleanNo,
          maleCount: male,
          femaleCount: female,
          thirdGenderCount: third,
          totalCount: total,
        };
      })
      .filter((item) => item.boothNo.length > 0);

    if (normalized.length === 0) {
      throw new BadRequestException('No valid booth numbers found in the provided payload');
    }

    // Fetch existing booths
    const existingBooths = await this.prisma.booth.findMany({
      select: {
        id: true,
        boothNo: true,
        name: true,
        maleCount: true,
        femaleCount: true,
        thirdGenderCount: true,
        totalCount: true,
      },
    });

    // Map by exact boothNo, lowercase, and without leading zeroes
    const existingMap = new Map<string, typeof existingBooths[0]>();
    for (const b of existingBooths) {
      const bNo = (b.boothNo || '').trim();
      existingMap.set(bNo, b);
      existingMap.set(bNo.toLowerCase(), b);
      const noLeadingZeros = bNo.replace(/^0+/, '');
      if (noLeadingZeros) existingMap.set(noLeadingZeros, b);
    }

    const updates: any[] = [];
    const notFound: string[] = [];
    const updatedBooths: Array<{
      id: string;
      boothNo: string;
      name: string;
      oldMale: number;
      newMale: number;
      oldFemale: number;
      newFemale: number;
      oldThird: number;
      newThird: number;
      oldTotal: number;
      newTotal: number;
    }> = [];

    const seenIds = new Set<string>();

    for (const item of normalized) {
      const match =
        existingMap.get(item.boothNo) ||
        existingMap.get(item.boothNo.toLowerCase()) ||
        existingMap.get(item.boothNo.replace(/^0+/, ''));

      if (match) {
        if (!seenIds.has(match.id)) {
          seenIds.add(match.id);
          updatedBooths.push({
            id: match.id,
            boothNo: match.boothNo,
            name: match.name,
            oldMale: match.maleCount,
            newMale: item.maleCount,
            oldFemale: match.femaleCount,
            newFemale: item.femaleCount,
            oldThird: match.thirdGenderCount,
            newThird: item.thirdGenderCount,
            oldTotal: match.totalCount,
            newTotal: item.totalCount,
          });

          updates.push(
            this.prisma.booth.update({
              where: { id: match.id },
              data: {
                maleCount: item.maleCount,
                femaleCount: item.femaleCount,
                thirdGenderCount: item.thirdGenderCount,
                totalCount: item.totalCount,
              },
            }),
          );
        }
      } else {
        notFound.push(item.boothNo);
      }
    }

    if (updates.length > 0) {
      await this.prisma.$transaction(updates);
    }

    return {
      success: true,
      updatedCount: updates.length,
      notFound,
      updatedBooths,
      totalProcessed: normalized.length,
    };
  }

  async updateElectionResultsBulk(dto: BulkUpdateBoothElectionResultsDto) {
    const list = dto?.results || [];
    if (!Array.isArray(list) || list.length === 0) {
      throw new BadRequestException('No election results data provided');
    }

    const electionYear = String(dto.electionYear || '').trim();
    const electionName = String(dto.electionName || '').trim();

    if (!electionYear || !electionName) {
      throw new BadRequestException('Election year and election name are required');
    }

    // Clean and normalize results
    const normalized = list
      .map((item) => {
        const rawNo = String(item.boothNo ?? '').trim();
        const cleanNo = rawNo.replace(/^#/, '').trim();
        const dmkVotes = Math.max(0, parseInt(String(item.dmkVotes ?? 0), 10) || 0);
        const aiadmkVotes = Math.max(0, parseInt(String(item.aiadmkVotes ?? 0), 10) || 0);
        const tvkVotes = Math.max(0, parseInt(String(item.tvkVotes ?? 0), 10) || 0);
        const providedTotal =
          item.totalVotesPolled !== undefined &&
          item.totalVotesPolled !== null &&
          String(item.totalVotesPolled).trim() !== ''
            ? parseInt(String(item.totalVotesPolled), 10)
            : null;

        const sumVotes = dmkVotes + aiadmkVotes + tvkVotes;
        const totalVotesPolled =
          providedTotal !== null && !isNaN(providedTotal) && providedTotal > 0
            ? providedTotal
            : sumVotes;

        const tvkPercentage =
          totalVotesPolled > 0
            ? Math.round((tvkVotes / totalVotesPolled) * 10000) / 100
            : 0;

        // Determine winner and margin
        const candidates = [
          { name: 'TVK', votes: tvkVotes },
          { name: 'DMK', votes: dmkVotes },
          { name: 'AIADMK', votes: aiadmkVotes },
        ].sort((a, b) => b.votes - a.votes);

        const winnerPartyName = candidates[0].votes > 0 ? candidates[0].name : null;
        const margin =
          candidates[0].votes > 0
            ? candidates[0].votes - (candidates[1]?.votes || 0)
            : null;

        return {
          boothNo: cleanNo,
          dmkVotes,
          aiadmkVotes,
          tvkVotes,
          totalVotesPolled,
          tvkPercentage,
          winnerPartyName,
          margin,
        };
      })
      .filter((item) => item.boothNo.length > 0);

    if (normalized.length === 0) {
      throw new BadRequestException('No valid booth records found in the payload');
    }

    // Fetch existing booths
    const existingBooths = await this.prisma.booth.findMany({
      select: {
        id: true,
        boothNo: true,
        name: true,
      },
    });

    const existingMap = new Map<string, typeof existingBooths[0]>();
    for (const b of existingBooths) {
      const bNo = (b.boothNo || '').trim();
      existingMap.set(bNo, b);
      existingMap.set(bNo.toLowerCase(), b);
      const noLeadingZeros = bNo.replace(/^0+/, '');
      if (noLeadingZeros) existingMap.set(noLeadingZeros, b);
    }

    const upserts: any[] = [];
    const notFound: string[] = [];
    const updatedBooths: Array<{
      boothId: string;
      boothNo: string;
      name: string;
      tvkVotes: number;
      dmkVotes: number;
      aiadmkVotes: number;
      totalVotes: number;
      winner: string | null;
      margin: number | null;
    }> = [];

    const seenIds = new Set<string>();

    for (const item of normalized) {
      const match =
        existingMap.get(item.boothNo) ||
        existingMap.get(item.boothNo.toLowerCase()) ||
        existingMap.get(item.boothNo.replace(/^0+/, ''));

      if (match) {
        if (!seenIds.has(match.id)) {
          seenIds.add(match.id);
          updatedBooths.push({
            boothId: match.id,
            boothNo: match.boothNo,
            name: match.name,
            tvkVotes: item.tvkVotes,
            dmkVotes: item.dmkVotes,
            aiadmkVotes: item.aiadmkVotes,
            totalVotes: item.totalVotesPolled,
            winner: item.winnerPartyName,
            margin: item.margin,
          });

          upserts.push(
            this.prisma.boothElectionResult.upsert({
              where: {
                boothId_electionYear_electionName: {
                  boothId: match.id,
                  electionYear,
                  electionName,
                },
              },
              update: {
                electionId: dto.electionId || undefined,
                totalVotesPolled: item.totalVotesPolled,
                tvkVotes: item.tvkVotes,
                tvkPercentage: item.tvkPercentage,
                topParty1Name: 'DMK',
                topParty1Votes: item.dmkVotes,
                topParty2Name: 'AIADMK',
                topParty2Votes: item.aiadmkVotes,
                winnerPartyName: item.winnerPartyName,
                margin: item.margin,
              },
              create: {
                boothId: match.id,
                electionId: dto.electionId || undefined,
                electionYear,
                electionName,
                totalVotesPolled: item.totalVotesPolled,
                tvkVotes: item.tvkVotes,
                tvkPercentage: item.tvkPercentage,
                topParty1Name: 'DMK',
                topParty1Votes: item.dmkVotes,
                topParty2Name: 'AIADMK',
                topParty2Votes: item.aiadmkVotes,
                winnerPartyName: item.winnerPartyName,
                margin: item.margin,
              },
            }),
          );
        }
      } else {
        notFound.push(item.boothNo);
      }
    }

    if (upserts.length > 0) {
      await this.prisma.$transaction(upserts);
    }

    return {
      success: true,
      updatedCount: upserts.length,
      notFound,
      updatedBooths,
      totalProcessed: normalized.length,
    };
  }

  private async sanitizeBoothData(dto: any) {
    const { kilaiIds, agentIds, villageIds, agents, ...rawBoothData } = dto;
    const boothData = { ...rawBoothData };

    if ('unionId' in boothData) {
      const trimmed =
        typeof boothData.unionId === 'string'
          ? boothData.unionId.trim()
          : null;
      if (trimmed && trimmed !== '__NONE__') {
        const union = await this.prisma.union.findUnique({
          where: { id: trimmed },
          select: { id: true },
        });
        boothData.unionId = union ? union.id : null;
      } else {
        boothData.unionId = null;
      }
    }

    if ('panchayatId' in boothData) {
      const trimmed =
        typeof boothData.panchayatId === 'string'
          ? boothData.panchayatId.trim()
          : null;
      if (trimmed && trimmed !== '__NONE__') {
        const panchayat = await this.prisma.panchayat.findUnique({
          where: { id: trimmed },
          select: { id: true, unionId: true },
        });
        if (panchayat) {
          boothData.panchayatId = panchayat.id;
          if (!boothData.unionId && panchayat.unionId) {
            boothData.unionId = panchayat.unionId;
          }
        } else {
          boothData.panchayatId = null;
        }
      } else {
        boothData.panchayatId = null;
      }
    }

    return {
      boothData,
      kilaiIds,
      agentIds,
      villageIds,
    };
  }

  async create(createBoothDto: CreateBoothDto) {
    const { boothData, kilaiIds, agentIds, villageIds } =
      await this.sanitizeBoothData(createBoothDto);

    return this.prisma.booth.create({
      data: {
        ...boothData,
        kilais:
          kilaiIds && kilaiIds.length > 0
            ? {
                connect: kilaiIds.map((id: string) => ({ id })),
              }
            : undefined,
        agents:
          agentIds && agentIds.length > 0
            ? {
                connect: agentIds.map((id: string) => ({ id })),
              }
            : undefined,
        villages:
          villageIds && villageIds.length > 0
            ? {
                connect: villageIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        kilais: true,
        agents: {
          include: {
            homeKilai: true,
            union: true,
            district: true,
          },
        },
        panchayatRel: true,
        villages: true,
        electionResults: {
          orderBy: { electionYear: 'desc' },
        },
        agentAssignments: {
          include: {
            cadre: {
              include: {
                homeKilai: true,
                union: true,
                district: true,
              },
            },
            election: true,
          },
        },
      },
    });
  }

  async findAll(unionId?: string, panchayatId?: string, villageId?: string) {
    const where: any = {};
    if (unionId) where.unionId = unionId;
    if (panchayatId) where.panchayatId = panchayatId;
    if (villageId) {
      where.villages = {
        some: { id: villageId },
      };
    }

    const [booths, currentElection] = await Promise.all([
      this.prisma.booth.findMany({
        where,
        include: {
          union: true,
          panchayatRel: true,
          villages: true,
          kilais: true,
          agents: {
            include: {
              homeKilai: true,
              union: true,
              district: true,
            },
          },
          electionResults: {
            orderBy: { electionYear: 'desc' },
          },
          agentAssignments: {
            include: {
              cadre: {
                include: {
                  homeKilai: true,
                  union: true,
                  district: true,
                },
              },
              election: true,
            },
          },
        },
      }),
      this.prisma.election.findFirst({
        where: { isCurrent: true },
      }) ||
        this.prisma.election.findFirst({
          orderBy: { year: 'desc' },
        }),
    ]);

    // Attach latestElection and latestAgents to each booth
    const mapped = booths.map((b) => {
      let latestAgents: any[] = [];
      if (currentElection) {
        const assignments = (b.agentAssignments || []).filter(
          (a) => a.electionId === currentElection.id,
        );
        if (assignments.length > 0) {
          latestAgents = assignments.map((a) => ({
            ...a.cadre,
            assignmentRole: a.role,
            assignmentId: a.id,
            blaFormUrl: a.blaFormUrl,
            assignmentNotes: a.notes,
          }));
        }
      }

      // If no assignments for current election yet, fallback to legacy booth.agents
      if (latestAgents.length === 0 && b.agents && b.agents.length > 0) {
        latestAgents = b.agents;
      }

      return {
        ...b,
        latestElection: currentElection,
        latestAgents,
      };
    });

    // Use natural alphanumeric sorting so "10" comes after "2"
    return mapped.sort((a, b) =>
      a.boothNo.localeCompare(b.boothNo, undefined, { numeric: true }),
    );
  }

  async findOne(id: string) {
    const [booth, currentElection] = await Promise.all([
      this.prisma.booth.findUnique({
        where: { id },
        include: {
          union: true,
          panchayatRel: true,
          villages: true,
          kilais: true,
          agents: {
            include: {
              homeKilai: true,
              union: true,
              district: true,
            },
          },
          electionResults: {
            orderBy: { electionYear: 'desc' },
          },
          agentAssignments: {
            include: {
              cadre: {
                include: {
                  homeKilai: true,
                  union: true,
                  district: true,
                },
              },
              election: true,
            },
          },
        },
      }),
      this.prisma.election.findFirst({
        where: { isCurrent: true },
      }) ||
        this.prisma.election.findFirst({
          orderBy: { year: 'desc' },
        }),
    ]);

    if (!booth) {
      throw new NotFoundException(`Booth with ID ${id} not found`);
    }

    let latestAgents: any[] = [];
    if (currentElection) {
      const assignments = (booth.agentAssignments || []).filter(
        (a) => a.electionId === currentElection.id,
      );
      if (assignments.length > 0) {
        latestAgents = assignments.map((a) => ({
          ...a.cadre,
          assignmentRole: a.role,
          assignmentId: a.id,
          blaFormUrl: a.blaFormUrl,
          assignmentNotes: a.notes,
        }));
      }
    }
    if (latestAgents.length === 0 && booth.agents && booth.agents.length > 0) {
      latestAgents = booth.agents;
    }

    return {
      ...booth,
      latestElection: currentElection,
      latestAgents,
    };
  }

  async update(id: string, updateBoothDto: UpdateBoothDto) {
    // Check if booth exists
    await this.findOne(id);

    const { boothData, kilaiIds, agentIds, villageIds } =
      await this.sanitizeBoothData(updateBoothDto);

    return this.prisma.booth.update({
      where: { id },
      data: {
        ...boothData,
        kilais:
          kilaiIds !== undefined
            ? {
                set: kilaiIds.map((id: string) => ({ id })),
              }
            : undefined,
        agents:
          agentIds !== undefined
            ? {
                set: agentIds.map((id: string) => ({ id })),
              }
            : undefined,
        villages:
          villageIds !== undefined
            ? {
                set: villageIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        union: true,
        panchayatRel: true,
        villages: true,
        kilais: true,
        agents: {
          include: {
            homeKilai: true,
            union: true,
            district: true,
          },
        },
        electionResults: {
          orderBy: { electionYear: 'desc' },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.booth.delete({
      where: { id },
    });
  }

  async addElectionResult(boothId: string, dto: CreateBoothElectionResultDto) {
    await this.findOne(boothId);
    const totalVotesPolled = Number(dto.totalVotesPolled) || 0;
    const tvkVotes = Number(dto.tvkVotes) || 0;
    const tvkPercentage =
      dto.tvkPercentage !== undefined
        ? Number(dto.tvkPercentage)
        : totalVotesPolled > 0
          ? Math.round((tvkVotes / totalVotesPolled) * 10000) / 100
          : 0;

    const topParty1Votes = Number(dto.topParty1Votes) || 0;
    const topParty2Votes = Number(dto.topParty2Votes) || 0;

    let margin = dto.margin !== undefined && dto.margin !== null ? Number(dto.margin) : null;
    let winnerPartyName = dto.winnerPartyName || null;

    if (margin === null && (tvkVotes > 0 || topParty1Votes > 0)) {
      const candidates = [
        { name: 'TVK', votes: tvkVotes },
        { name: dto.topParty1Name || 'Party 1', votes: topParty1Votes },
        { name: dto.topParty2Name || 'Party 2', votes: topParty2Votes },
      ].sort((a, b) => b.votes - a.votes);
      if (!winnerPartyName) winnerPartyName = candidates[0].name;
      margin = candidates[0].votes - (candidates[1]?.votes || 0);
    }

    return this.prisma.boothElectionResult.create({
      data: {
        boothId,
        electionYear: String(dto.electionYear || '').trim(),
        electionName: String(dto.electionName || '').trim(),
        totalVotesPolled,
        tvkVotes,
        tvkPercentage,
        topParty1Name: dto.topParty1Name ? String(dto.topParty1Name).trim() : null,
        topParty1Votes,
        topParty2Name: dto.topParty2Name ? String(dto.topParty2Name).trim() : null,
        topParty2Votes,
        winnerPartyName,
        margin,
        notes: dto.notes ? String(dto.notes).trim() : null,
      },
    });
  }

  async updateElectionResult(
    boothId: string,
    resultId: string,
    dto: Partial<CreateBoothElectionResultDto>,
  ) {
    const existing = await this.prisma.boothElectionResult.findUnique({
      where: { id: resultId },
    });
    if (!existing || existing.boothId !== boothId) {
      throw new NotFoundException(
        `Election result with ID ${resultId} not found for this booth`,
      );
    }

    const totalVotesPolled =
      dto.totalVotesPolled !== undefined
        ? Number(dto.totalVotesPolled)
        : existing.totalVotesPolled;
    const tvkVotes =
      dto.tvkVotes !== undefined ? Number(dto.tvkVotes) : existing.tvkVotes;
    const tvkPercentage =
      dto.tvkPercentage !== undefined
        ? Number(dto.tvkPercentage)
        : totalVotesPolled > 0
          ? Math.round((tvkVotes / totalVotesPolled) * 10000) / 100
          : 0;

    return this.prisma.boothElectionResult.update({
      where: { id: resultId },
      data: {
        electionYear:
          dto.electionYear !== undefined
            ? String(dto.electionYear).trim()
            : undefined,
        electionName:
          dto.electionName !== undefined
            ? String(dto.electionName).trim()
            : undefined,
        totalVotesPolled,
        tvkVotes,
        tvkPercentage,
        topParty1Name:
          dto.topParty1Name !== undefined
            ? dto.topParty1Name
              ? String(dto.topParty1Name).trim()
              : null
            : undefined,
        topParty1Votes:
          dto.topParty1Votes !== undefined
            ? Number(dto.topParty1Votes)
            : undefined,
        topParty2Name:
          dto.topParty2Name !== undefined
            ? dto.topParty2Name
              ? String(dto.topParty2Name).trim()
              : null
            : undefined,
        topParty2Votes:
          dto.topParty2Votes !== undefined
            ? Number(dto.topParty2Votes)
            : undefined,
        winnerPartyName:
          dto.winnerPartyName !== undefined
            ? dto.winnerPartyName
              ? String(dto.winnerPartyName).trim()
              : null
            : undefined,
        margin:
          dto.margin !== undefined
            ? dto.margin !== null
              ? Number(dto.margin)
              : null
            : undefined,
        notes:
          dto.notes !== undefined
            ? dto.notes
              ? String(dto.notes).trim()
              : null
            : undefined,
      },
    });
  }

  async removeElectionResult(boothId: string, resultId: string) {
    const existing = await this.prisma.boothElectionResult.findUnique({
      where: { id: resultId },
    });
    if (!existing || existing.boothId !== boothId) {
      throw new NotFoundException(
        `Election result with ID ${resultId} not found for this booth`,
      );
    }
    return this.prisma.boothElectionResult.delete({
      where: { id: resultId },
    });
  }

  // --- Booth Agent Assignments per Election ---

  async getElectionAgents(boothId: string, electionId: string) {
    return this.prisma.boothAgentAssignment.findMany({
      where: { boothId, electionId },
      include: {
        cadre: {
          include: {
            homeKilai: true,
            union: true,
            district: true,
          },
        },
        election: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async assignElectionAgents(
    boothId: string,
    electionId: string,
    cadreIdsOrAgents:
      | string[]
      | Array<{
          cadreId: string;
          role?: string;
          blaFormUrl?: string | null;
          notes?: string;
        }>,
    defaultRole?: string,
  ) {
    await this.findOne(boothId);

    // Delete existing assignments for this booth and election
    await this.prisma.boothAgentAssignment.deleteMany({
      where: { boothId, electionId },
    });

    if (Array.isArray(cadreIdsOrAgents) && cadreIdsOrAgents.length > 0) {
      const data = cadreIdsOrAgents.map((item) => {
        if (typeof item === 'string') {
          return {
            boothId,
            electionId,
            cadreId: item,
            role: defaultRole || 'Booth Agent',
            blaFormUrl: null,
            notes: null,
          };
        }
        return {
          boothId,
          electionId,
          cadreId: item.cadreId,
          role: item.role || defaultRole || 'Booth Agent',
          blaFormUrl: item.blaFormUrl || null,
          notes: item.notes || null,
        };
      });

      // Create new assignments
      await this.prisma.boothAgentAssignment.createMany({
        data,
        skipDuplicates: true,
      });
    }

    return this.getElectionAgents(boothId, electionId);
  }

  async addElectionAgent(
    boothId: string,
    electionId: string,
    cadreId: string,
    role?: string,
    blaFormUrl?: string | null,
    notes?: string,
  ) {
    await this.findOne(boothId);

    return this.prisma.boothAgentAssignment.upsert({
      where: {
        boothId_cadreId_electionId: {
          boothId,
          cadreId,
          electionId,
        },
      },
      update: {
        ...(role !== undefined ? { role } : {}),
        ...(blaFormUrl !== undefined ? { blaFormUrl } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      create: {
        boothId,
        electionId,
        cadreId,
        role: role || 'Booth Agent',
        blaFormUrl: blaFormUrl || null,
        notes: notes || null,
      },
      include: {
        cadre: {
          include: {
            homeKilai: true,
            union: true,
            district: true,
          },
        },
        election: true,
      },
    });
  }

  async updateElectionAgent(
    boothId: string,
    electionId: string,
    cadreId: string,
    data: {
      role?: string;
      blaFormUrl?: string | null;
      notes?: string;
      newCadreId?: string;
    },
  ) {
    const existing = await this.prisma.boothAgentAssignment.findUnique({
      where: {
        boothId_cadreId_electionId: {
          boothId,
          cadreId,
          electionId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Booth agent assignment not found');
    }

    if (data.newCadreId && data.newCadreId !== cadreId) {
      // Cadre is changed, delete previous and create new
      await this.prisma.boothAgentAssignment.delete({
        where: { id: existing.id },
      });

      return this.prisma.boothAgentAssignment.create({
        data: {
          boothId,
          electionId,
          cadreId: data.newCadreId,
          role: data.role ?? existing.role,
          blaFormUrl:
            data.blaFormUrl !== undefined ? data.blaFormUrl : existing.blaFormUrl,
          notes: data.notes ?? existing.notes,
        },
        include: {
          cadre: {
            include: {
              homeKilai: true,
              union: true,
              district: true,
            },
          },
          election: true,
        },
      });
    }

    return this.prisma.boothAgentAssignment.update({
      where: { id: existing.id },
      data: {
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.blaFormUrl !== undefined ? { blaFormUrl: data.blaFormUrl } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: {
        cadre: {
          include: {
            homeKilai: true,
            union: true,
            district: true,
          },
        },
        election: true,
      },
    });
  }

  async removeElectionAgent(
    boothId: string,
    electionId: string,
    cadreId: string,
  ) {
    return this.prisma.boothAgentAssignment.deleteMany({
      where: {
        boothId,
        electionId,
        cadreId,
      },
    });
  }
}
