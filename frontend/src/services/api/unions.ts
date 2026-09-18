import { fetchWithAuth } from './client';
import { District } from './districts';
import { Cadre } from './cadres';

export interface Union {
  id: string;
  name: string;
  districtId: string;
  group: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  attachments?: any;
  district?: District;
  createdAt: string;
  updatedAt: string;
  _count?: {
    kilais: number;
    cadres: number;
  };
  totalBooths?: number;
  unionCadres?: Cadre[];
}

export interface CreateUnionDto {
  name: string;
  districtId: string;
  group: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  attachments?: any;
}

export const unionApi = {
  getAll: async (): Promise<Union[]> => {
    const res = await fetchWithAuth('/api/v1/unions');
    return res.json();
  },

  getById: async (id: string): Promise<Union> => {
    const res = await fetchWithAuth(`/api/v1/unions/${id}`);
    return res.json();
  },

  create: async (data: CreateUnionDto): Promise<Union> => {
    const res = await fetchWithAuth('/api/v1/unions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: Partial<CreateUnionDto>): Promise<Union> => {
    const res = await fetchWithAuth(`/api/v1/unions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/api/v1/unions/${id}`, {
      method: 'DELETE',
    });
  },
};
