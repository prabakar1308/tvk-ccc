import { fetchWithAuth } from './client';

export interface Kilai {
  id: string;
  code: string;
  name: string;
  tamilName?: string;
  secretaryName?: string;
  secretaryPhoto?: string;
  secretary?: {
    id: string;
    name: string;
    phone?: string;
    photoUrl?: string;
  };
  panchayat?: string;
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
    const url = locale ? `/api/v1/kilais/${id}?lang=${locale}` : `/api/v1/kilais/${id}`;
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

