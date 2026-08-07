import { fetchWithAuth } from './client';

export interface Booth {
  id: string;
  name: string;
  boothNo: string;
  maleCount: number;
  femaleCount: number;
  thirdGenderCount: number;
  totalCount: number;
  kilais?: any[];
  agents?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoothDto {
  name: string;
  boothNo: string;
  maleCount?: number;
  femaleCount?: number;
  thirdGenderCount?: number;
  totalCount?: number;
  kilaiIds?: string[];
  agentIds?: string[];
}

export const boothApi = {
  getAll: async (): Promise<Booth[]> => {
    const res = await fetchWithAuth('/api/v1/booths');
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
};
