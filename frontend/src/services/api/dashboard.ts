import { fetchWithAuth } from './client';

export interface DashboardStats {
  totalUnions: number;
  totalKilais: number;
  totalCadres: number;
  totalBooths: number;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await fetchWithAuth('/api/v1/dashboard/stats');
    return res.json();
  },
};
