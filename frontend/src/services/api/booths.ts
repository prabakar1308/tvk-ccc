import { fetchWithAuth } from './client';

export interface BoothElectionResult {
  id: string;
  boothId: string;
  electionYear: string;
  electionName: string;
  totalVotesPolled: number;
  tvkVotes: number;
  tvkPercentage: number;
  topParty1Name?: string | null;
  topParty1Votes: number;
  topParty2Name?: string | null;
  topParty2Votes: number;
  winnerPartyName?: string | null;
  margin?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBoothElectionResultDto {
  electionYear: string;
  electionName: string;
  totalVotesPolled: number;
  tvkVotes: number;
  tvkPercentage?: number;
  topParty1Name?: string;
  topParty1Votes?: number;
  topParty2Name?: string;
  topParty2Votes?: number;
  winnerPartyName?: string;
  margin?: number;
  notes?: string;
}

export interface BoothAgentAssignment {
  id: string;
  boothId: string;
  cadreId: string;
  electionId: string;
  role?: string;
  blaFormUrl?: string | null;
  notes?: string;
  cadre?: any;
  election?: any;
  createdAt?: string;
}

export interface AgentAssignmentPayload {
  cadreId: string;
  role?: string;
  blaFormUrl?: string | null;
  notes?: string;
}

export interface Booth {
  id: string;
  name: string;
  boothNo: string;
  area?: string;
  maleCount: number;
  femaleCount: number;
  thirdGenderCount: number;
  totalCount: number;
  unionId?: string | null;
  panchayatId?: string | null;
  union?: any;
  panchayatRel?: any;
  villages?: any[];
  kilais?: any[];
  agents?: any[];
  agentAssignments?: BoothAgentAssignment[];
  latestElection?: any;
  latestAgents?: any[];
  electionResults?: BoothElectionResult[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoothDto {
  name: string;
  boothNo: string;
  area?: string;
  maleCount?: number;
  femaleCount?: number;
  thirdGenderCount?: number;
  totalCount?: number;
  unionId?: string | null;
  panchayatId?: string | null;
  villageIds?: string[];
  kilaiIds?: string[];
  agentIds?: string[];
}

export const boothApi = {
  getAll: async (params?: { unionId?: string; panchayatId?: string; villageId?: string }): Promise<Booth[]> => {
    const query = new URLSearchParams();
    if (params?.unionId) query.append('unionId', params.unionId);
    if (params?.panchayatId) query.append('panchayatId', params.panchayatId);
    if (params?.villageId) query.append('villageId', params.villageId);
    const qs = query.toString();
    const res = await fetchWithAuth(`/api/v1/booths${qs ? `?${qs}` : ''}`);
    return res.json();
  },

  getAreas: async (): Promise<string[]> => {
    const res = await fetchWithAuth('/api/v1/booths/areas');
    return res.json();
  },

  getById: async (id: string): Promise<Booth> => {
    const res = await fetchWithAuth(`/api/v1/booths/${id}`);
    return res.json();
  },

  create: async (data: CreateBoothDto): Promise<Booth> => {
    const res = await fetchWithAuth('/api/v1/booths', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: Partial<CreateBoothDto>): Promise<Booth> => {
    const res = await fetchWithAuth(`/api/v1/booths/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/api/v1/booths/${id}`, {
      method: 'DELETE',
    });
  },

  addElectionResult: async (boothId: string, data: CreateBoothElectionResultDto): Promise<BoothElectionResult> => {
    const res = await fetchWithAuth(`/api/v1/booths/${boothId}/election-results`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateElectionResult: async (boothId: string, resultId: string, data: Partial<CreateBoothElectionResultDto>): Promise<BoothElectionResult> => {
    const res = await fetchWithAuth(`/api/v1/booths/${boothId}/election-results/${resultId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteElectionResult: async (boothId: string, resultId: string): Promise<void> => {
    await fetchWithAuth(`/api/v1/booths/${boothId}/election-results/${resultId}`, {
      method: 'DELETE',
    });
  },

  getElectionAgents: async (boothId: string, electionId: string): Promise<BoothAgentAssignment[]> => {
    const res = await fetchWithAuth(`/api/v1/booths/${boothId}/elections/${electionId}/agents`);
    return res.json();
  },

  assignElectionAgents: async (
    boothId: string,
    electionId: string,
    agentsOrCadreIds: string[] | AgentAssignmentPayload[],
    role?: string,
  ): Promise<BoothAgentAssignment[]> => {
    const payload =
      agentsOrCadreIds.length > 0 && typeof agentsOrCadreIds[0] === 'object'
        ? { agents: agentsOrCadreIds as AgentAssignmentPayload[], role }
        : { cadreIds: agentsOrCadreIds as string[], role };
    const res = await fetchWithAuth(
      `/api/v1/booths/${boothId}/elections/${electionId}/agents`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return res.json();
  },

  updateElectionAgent: async (
    boothId: string,
    electionId: string,
    cadreId: string,
    data: {
      role?: string;
      blaFormUrl?: string | null;
      notes?: string;
      newCadreId?: string;
    },
  ): Promise<BoothAgentAssignment> => {
    const res = await fetchWithAuth(
      `/api/v1/booths/${boothId}/elections/${electionId}/agents/${cadreId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
    return res.json();
  },

  addElectionAgent: async (boothId: string, electionId: string, cadreId: string, role?: string): Promise<BoothAgentAssignment> => {
    const res = await fetchWithAuth(`/api/v1/booths/${boothId}/elections/${electionId}/agents/single`, {
      method: 'POST',
      body: JSON.stringify({ cadreId, role }),
    });
    return res.json();
  },

  removeElectionAgent: async (boothId: string, electionId: string, cadreId: string): Promise<void> => {
    await fetchWithAuth(`/api/v1/booths/${boothId}/elections/${electionId}/agents/${cadreId}`, {
      method: 'DELETE',
    });
  },
};
