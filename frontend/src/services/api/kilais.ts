import { fetchWithAuth } from './client';
import { translateAreaToEnglish } from '@/lib/area-translations';

export interface Kilai {
  id: string;
  code: string;
  name: string;
  tamilName?: string;
  nameTa?: string;
  nameEn?: string;
  englishName?: string;
  slug?: string;
  secretaryName?: string;
  secretaryPhoto?: string;
  secretary?: {
    id: string;
    name: string;
    phone?: string;
    photoUrl?: string;
  };
  panchayat?: string;
  panchayatId?: string;
  panchayatRel?: any;
  description?: string;
  unionId: string;
  villages?: string[];
  villageIds?: string[];
  villagesRel?: any[];
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  healthScore: number;
  createdAt: string;
  updatedAt: string;
  linkedBooths?: string[];
  booths?: any[];
  _count?: {
    cadres: number;
  };
}

export interface CreateKilaiDto {
  name: string;
  tamilName?: string;
  secretaryName?: string;
  panchayat?: string;
  panchayatId?: string;
  description?: string;
  unionId: string;
  villages?: string[];
  villageIds?: string[];
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  linkedBooths?: string[];
}

export const kilaiApi = {
  getAll: async (locale?: string): Promise<Kilai[]> => {
    const url = locale ? `/api/v1/kilais?lang=${locale}` : '/api/v1/kilais';
    const res = await fetchWithAuth(url);
    return res.json();
  },

  getUnions: async (locale?: string): Promise<any[]> => {
    const url = locale ? `/api/v1/unions?lang=${locale}` : '/api/v1/unions';
    const res = await fetchWithAuth(url);
    return res.json();
  },

  getById: async (id: string, locale?: string): Promise<Kilai> => {
    const decoded = decodeURIComponent(id);
    const cleanId = /[\u0B80-\u0BFF]/.test(decoded)
      ? translateAreaToEnglish(decoded) || decoded
      : decoded;
    const url = locale ? `/api/v1/kilais/${encodeURIComponent(cleanId)}?lang=${locale}` : `/api/v1/kilais/${encodeURIComponent(cleanId)}`;
    const res = await fetchWithAuth(url);
    return res.json();
  },

  create: async (data: CreateKilaiDto): Promise<Kilai> => {
    const res = await fetchWithAuth('/api/v1/kilais', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  createBulk: async (data: CreateKilaiDto[]): Promise<any> => {
    const res = await fetchWithAuth('/api/v1/kilais/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: Partial<CreateKilaiDto>): Promise<Kilai> => {
    const res = await fetchWithAuth(`/api/v1/kilais/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: string): Promise<any> => {
    const res = await fetchWithAuth(`/api/v1/kilais/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  getOfficeBearers: async (kilaiId: string, locale?: string): Promise<any[]> => {
    const url = locale ? `/api/v1/kilais/${kilaiId}/office-bearers?lang=${locale}` : `/api/v1/kilais/${kilaiId}/office-bearers`;
    const res = await fetchWithAuth(url);
    return res.json();
  },

  createOfficeBearer: async (kilaiId: string, data: any): Promise<any> => {
    const res = await fetchWithAuth(`/api/v1/kilais/${kilaiId}/office-bearers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateOfficeBearer: async (kilaiId: string, bearerId: string, data: any): Promise<any> => {
    const res = await fetchWithAuth(`/api/v1/kilais/${kilaiId}/office-bearers/${bearerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteOfficeBearer: async (kilaiId: string, bearerId: string): Promise<any> => {
    const res = await fetchWithAuth(`/api/v1/kilais/${kilaiId}/office-bearers/${bearerId}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};

