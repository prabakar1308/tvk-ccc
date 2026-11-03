import { fetchWithAuth } from './client';

export interface Booth {
  id: string;
  name: string;
  boothNo: string;
  area?: string;
  maleCount: number;
  femaleCount: number;
  thirdGenderCount: number;
  totalCount: number;
  unionId?: string;
  panchayatId?: string;
  union?: any;
  panchayatRel?: any;
  villages?: any[];
  kilais?: any[];
  agents?: any[];
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
  unionId?: string;
  panchayatId?: string;
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
};
