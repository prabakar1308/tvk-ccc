import { fetchWithAuth } from './client';

export interface Cadre {
  id: string;
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
  rawRole?: string;
  canonicalRole?: string;
  area?: string;
  boothNo?: string;
  officeBearerRoles?: { role: string }[];
  wingId?: string;
  wing?: any;
  user?: {
    role?: {
      name: string;
    };
  };
  district?: {
    id: string;
    name: string;
  };
  union?: {
    name: string;
  };
  homeKilai?: {
    name: string;
  };
}

export type CreateCadreDto = Omit<Cadre, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCadreDto = Partial<CreateCadreDto>;

export const cadreApi = {
  getAll: async (params?: Record<string, string>, locale?: string): Promise<Cadre[]> => {
    const searchParams = new URLSearchParams(params);
    if (locale) searchParams.set('lang', locale);
    const query = searchParams.toString();
    const res = await fetchWithAuth(
      `/api/v1/cadres${query ? `?${query}` : ''}`,
      locale ? { headers: { 'Accept-Language': locale } } : {}
    );
    return res.json();
  },
  
  getById: async (id: string, locale?: string): Promise<Cadre> => {
    const res = await fetchWithAuth(
      `/api/v1/cadres/${id}${locale ? `?lang=${locale}` : ''}`,
      locale ? { headers: { 'Accept-Language': locale } } : {}
    );
    return res.json();
  },

  create: async (data: CreateCadreDto): Promise<Cadre> => {
    const res = await fetchWithAuth('/api/v1/cadres', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  createBulk: async (data: CreateCadreDto[]): Promise<{ message: string; count: number }> => {
    const res = await fetchWithAuth('/api/v1/cadres/bulk', {
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
