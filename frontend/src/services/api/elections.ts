import { fetchWithAuth } from './client';

export interface Election {
  id: string;
  name: string;
  nameTa?: string | null;
  year: string;
  type: string; // 'ASSEMBLY' | 'PARLIAMENTARY' | 'LOCAL_BODY' | 'BY_ELECTION'
  date?: string | null;
  isCurrent: boolean;
  status: string; // 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    electionResults?: number;
    agentAssignments?: number;
  };
}

export interface CreateElectionDto {
  name: string;
  nameTa?: string;
  year: string;
  type?: string;
  date?: string;
  isCurrent?: boolean;
  status?: string;
  description?: string;
}

export type UpdateElectionDto = Partial<CreateElectionDto>;

export const electionsApi = {
  async getAll(): Promise<Election[]> {
    const res = await fetchWithAuth('/api/v1/elections');
    return res.json();
  },

  async getCurrent(): Promise<Election> {
    const res = await fetchWithAuth('/api/v1/elections/current');
    return res.json();
  },

  async getById(id: string): Promise<Election> {
    const res = await fetchWithAuth(`/api/v1/elections/${id}`);
    return res.json();
  },

  async create(data: CreateElectionDto): Promise<Election> {
    const res = await fetchWithAuth('/api/v1/elections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async update(id: string, data: UpdateElectionDto): Promise<Election> {
    const res = await fetchWithAuth(`/api/v1/elections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async setCurrent(id: string): Promise<Election> {
    const res = await fetchWithAuth(`/api/v1/elections/${id}/set-current`, {
      method: 'POST',
    });
    return res.json();
  },

  async delete(id: string): Promise<void> {
    await fetchWithAuth(`/api/v1/elections/${id}`, {
      method: 'DELETE',
    });
  },
};
