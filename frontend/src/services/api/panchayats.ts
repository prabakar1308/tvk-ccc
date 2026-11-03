import { fetchWithAuth } from './client';
import { Union } from './unions';

export interface Panchayat {
  id: string;
  name: string;
  nameTa: string;
  code?: string;
  type: 'VILLAGE_PANCHAYAT' | 'TOWN_PANCHAYAT_WARD' | 'MUNICIPALITY_WARD';
  wardNumber?: number;
  centerLat?: number;
  centerLng?: number;
  boundary?: any;
  description?: string;
  unionId: string;
  union?: Union;
  villages?: any[];
  kilais?: any[];
  booths?: any[];
  _count?: {
    villages: number;
    kilais: number;
    booths: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePanchayatDto {
  name: string;
  nameTa: string;
  code?: string;
  type?: 'VILLAGE_PANCHAYAT' | 'TOWN_PANCHAYAT_WARD' | 'MUNICIPALITY_WARD';
  wardNumber?: number;
  centerLat?: number;
  centerLng?: number;
  boundary?: any;
  description?: string;
  unionId: string;
}

export const panchayatApi = {
  getAll: async (unionId?: string, search?: string): Promise<Panchayat[]> => {
    const params = new URLSearchParams();
    if (unionId) params.append('unionId', unionId);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithAuth(`/api/v1/panchayats${qs}`);
    return res.json();
  },

  getById: async (id: string): Promise<Panchayat> => {
    const res = await fetchWithAuth(`/api/v1/panchayats/${id}`);
    return res.json();
  },

  create: async (data: CreatePanchayatDto): Promise<Panchayat> => {
    const res = await fetchWithAuth('/api/v1/panchayats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: Partial<CreatePanchayatDto>): Promise<Panchayat> => {
    const res = await fetchWithAuth(`/api/v1/panchayats/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateGeo: async (
    id: string,
    geoData: { centerLat?: number; centerLng?: number; boundary?: any }
  ): Promise<Panchayat> => {
    const res = await fetchWithAuth(`/api/v1/panchayats/${id}/geo`, {
      method: 'PATCH',
      body: JSON.stringify(geoData),
    });
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/api/v1/panchayats/${id}`, {
      method: 'DELETE',
    });
  },
};
