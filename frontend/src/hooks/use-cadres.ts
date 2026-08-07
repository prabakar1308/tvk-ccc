import { useQuery } from '@tanstack/react-query';
import { cadreApi } from '@/services/api/cadres';

export function useCadres() {
  return useQuery({
    queryKey: ['cadres'],
    queryFn: cadreApi.getAll,
  });
}
