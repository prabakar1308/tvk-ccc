import { fetchWithAuth } from './client';

export interface District {
  id: string;
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  attachments?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDistrictDto {
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  attachments?: any;
}

export const districtApi = {
  getAll: async (): Promise<District[]> => {
    const res = await fetchWithAuth('/api/v1/district');
    return res.json();
  },

  getById: async (id: string): Promise<District> => {
    const res = await fetchWithAuth(`/api/v1/district/${id}`);
    return res.json();
  },

  create: async (data: CreateDistrictDto): Promise<District> => {
    const res = await fetchWithAuth('/api/v1/district', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: Partial<CreateDistrictDto>): Promise<District> => {
    const res = await fetchWithAuth(`/api/v1/district/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/api/v1/district/${id}`, {
      method: 'DELETE',
    });
  },
};
