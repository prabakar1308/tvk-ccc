import { fetchWithAuth } from './client';

export interface Cadre {
  id: string;
  userId?: string;
  memberId: string;
  name: string;
  phone?: string;
  aadhaarNumber?: string;
  voterId?: string;
  photoUrl?: string;
  attachments?: any;
  level: 'DISTRICT' | 'GROUP' | 'UNION' | 'KILAI';
  districtId?: string;
  districtGroup?: 'KURINJIPADI' | 'CUDDALORE';
  unionId?: string;
  homeKilaiId?: string;
  role?: string; // We'll handle primary role mapping if needed
}

export type CreateCadreDto = Omit<Cadre, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCadreDto = Partial<CreateCadreDto>;

export const cadreApi = {
  getAll: async (params?: Record<string, string>): Promise<Cadre[]> => {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`/api/v1/cadres${query ? `?${query}` : ''}`);
    return res.json();
  },
  
  getById: async (id: string): Promise<Cadre> => {
    const res = await fetchWithAuth(`/api/v1/cadres/${id}`);
    return res.json();
  },

  create: async (data: CreateCadreDto): Promise<Cadre> => {
    const res = await fetchWithAuth('/api/v1/cadres', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: UpdateCadreDto): Promise<Cadre> => {
    const res = await fetchWithAuth(`/api/v1/cadres/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/api/v1/cadres/${id}`, {
      method: 'DELETE',
    });
  },
};
