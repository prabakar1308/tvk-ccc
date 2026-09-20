import { fetchWithAuth } from './client';

export interface Kilai {
  id: string;
  code: string;
  name: string;
  tamilName?: string;
  description?: string;
  unionId: string;
  villages?: string[];
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
}

export interface CreateKilaiDto {
  name: string;
  tamilName?: string;
  description?: string;
  unionId: string;
  villages?: string[];
  address?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  linkedBooths?: string[];
}

export const kilaiApi = {
  getAll: async (): Promise<Kilai[]> => {
    const res = await fetchWithAuth('/api/v1/kilais');
    return res.json();
  },

  getUnions: async (): Promise<any[]> => {
    const res = await fetchWithAuth('/api/v1/unions');
    return res.json();
  },

  getById: async (id: string): Promise<Kilai> => {
    const res = await fetchWithAuth(`/api/v1/kilais/${id}`);
    return res.json();
  },

  create: async (data: CreateKilaiDto): Promise<Kilai> => {
    const res = await fetchWithAuth('/api/v1/kilais', {
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

  getOfficeBearers: async (kilaiId: string): Promise<any[]> => {
    const res = await fetchWithAuth(`/api/v1/kilais/${kilaiId}/office-bearers`);
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

