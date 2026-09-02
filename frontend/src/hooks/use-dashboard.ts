import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api/dashboard';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardApi.getStats,
  });
}
