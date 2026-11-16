import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { cadreApi, CreateCadreDto, UpdateCadreDto } from '@/services/api/cadres';

export function useCadres(params?: Record<string, string>) {
  const locale = useLocale();
  return useQuery({
    queryKey: ['cadres', params, locale],
    queryFn: () => cadreApi.getAll(params, locale),
  });
}

export function useCadre(id: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: ['cadre', id, locale],
    queryFn: () => cadreApi.getById(id, locale),
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

export function useCreateBulkCadres() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCadreDto[]) => cadreApi.createBulk(data),
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

export function useMoveCadre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => cadreApi.move(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cadres'] });
      queryClient.invalidateQueries({ queryKey: ['cadre', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['unions'] });
      queryClient.invalidateQueries({ queryKey: ['kilais'] });
      queryClient.invalidateQueries({ queryKey: ['wings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useSwapCadres() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      cadreAId: string;
      cadreBId: string;
      roleA?: string;
      roleB?: string;
      swapAssignments?: boolean;
    }) => cadreApi.swap(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cadres'] });
      queryClient.invalidateQueries({ queryKey: ['cadre', variables.cadreAId] });
      queryClient.invalidateQueries({ queryKey: ['cadre', variables.cadreBId] });
      queryClient.invalidateQueries({ queryKey: ['unions'] });
      queryClient.invalidateQueries({ queryKey: ['kilais'] });
      queryClient.invalidateQueries({ queryKey: ['wings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}
