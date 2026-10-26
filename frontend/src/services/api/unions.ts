import { fetchWithAuth } from './client';
import { District } from './districts';
import { Cadre } from './cadres';

export interface Union {
  id: string;
  name: string;
  districtId?: string;
  group: string;
  unitType?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  areasCovered?: string[];
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
  kilais?: any[];
}

export interface CreateUnionDto {
  name: string;
  districtId?: string;
  group: string;
  unitType?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  areasCovered?: string[];
  attachments?: any;
}

export const unionApi = {
  getAll: async (locale?: string): Promise<Union[]> => {
    const url = locale ? `/api/v1/unions?lang=${locale}` : '/api/v1/unions';
    const res = await fetchWithAuth(url);
    return res.json();
  },

  getById: async (id: string, locale?: string): Promise<Union> => {
    const url = locale ? `/api/v1/unions/${id}?lang=${locale}` : `/api/v1/unions/${id}`;
    const res = await fetchWithAuth(url);
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

  getMasterAreas: async (): Promise<{ name: string; nameTa: string }[]> => {
    const res = await fetchWithAuth('/api/v1/unions/areas');
    return res.json();
  },
};
