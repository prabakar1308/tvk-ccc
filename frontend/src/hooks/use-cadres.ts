import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cadreApi, CreateCadreDto, UpdateCadreDto } from '@/services/api/cadres';

export function useCadres(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['cadres', params],
    queryFn: () => cadreApi.getAll(params),
  });
}

export function useCadre(id: string) {
  return useQuery({
    queryKey: ['cadre', id],
    queryFn: () => cadreApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCadre() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCadreDto) => cadreApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadres'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useUpdateCadre() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCadreDto }) => cadreApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cadres'] });
      queryClient.invalidateQueries({ queryKey: ['cadre', variables.id] });
    },
  });
}

export function useDeleteCadre() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => cadreApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadres'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}
