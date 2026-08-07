import { fetchWithAuth } from './client';

export interface Cadre {
  id: string;
  name: string;
  memberId: string;
  phone?: string;
  // add other fields if necessary
}

export const cadreApi = {
  getAll: async (): Promise<Cadre[]> => {
    const res = await fetchWithAuth('/api/v1/cadres');
    return res.json();
  },
};
