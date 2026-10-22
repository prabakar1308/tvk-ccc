import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { unionApi, Union, CreateUnionDto } from '@/services/api/unions';

export function useUnions() {
  const locale = useLocale();
  return useQuery({
    queryKey: ['unions', locale],
    queryFn: () => unionApi.getAll(locale),
  });
}

export function useUnion(id: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: ['unions', id, locale],
    queryFn: () => unionApi.getById(id, locale),
    enabled: !!id,
  });
}

export function useCreateUnion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUnionDto) => unionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unions'] });
    },
  });
}

export function useUpdateUnion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUnionDto> }) =>
      unionApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['unions'] });
      queryClient.invalidateQueries({ queryKey: ['unions', variables.id] });
    },
  });
}

export function useDeleteUnion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unions'] });
    },
  });
}

export function useMasterAreas() {
  return useQuery({
    queryKey: ['master-areas'],
    queryFn: unionApi.getMasterAreas,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

