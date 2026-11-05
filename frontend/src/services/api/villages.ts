import { fetchWithAuth } from './client';
import { Panchayat } from './panchayats';

export interface Village {
  id: string;
  name: string;
  nameTa: string;
  code?: string;
  centerLat?: number;
  centerLng?: number;
  boundary?: any;
  description?: string;
  panchayatId: string;
  panchayat?: Panchayat;
  kilais?: any[];
  booths?: any[];
  _count?: {
    kilais: number;
    booths: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVillageDto {
  name: string;
  nameTa: string;
  code?: string;
  centerLat?: number;
  centerLng?: number;
  description?: string;
  panchayatId: string;
}

export const villageApi = {
  getAll: async (panchayatId?: string, search?: string): Promise<Village[]> => {
    const params = new URLSearchParams();
    if (panchayatId) params.append('panchayatId', panchayatId);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithAuth(`/api/v1/villages${qs}`);
    return res.json();
  },

  getById: async (id: string): Promise<Village> => {
    const res = await fetchWithAuth(`/api/v1/villages/${id}`);
    return res.json();
  },

  create: async (data: CreateVillageDto): Promise<Village> => {
    const res = await fetchWithAuth('/api/v1/villages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: Partial<CreateVillageDto>): Promise<Village> => {
    const res = await fetchWithAuth(`/api/v1/villages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/api/v1/villages/${id}`, {
      method: 'DELETE',
    });
  },
};
