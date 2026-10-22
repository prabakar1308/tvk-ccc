import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { kilaiApi, Kilai, CreateKilaiDto } from '@/services/api/kilais';

export function useKilais() {
  const locale = useLocale();
  return useQuery({
    queryKey: ['kilais', locale],
    queryFn: () => kilaiApi.getAll(locale),
  });
}

export function useKilai(id: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: ['kilais', id, locale],
    queryFn: () => kilaiApi.getById(id, locale),
    enabled: !!id,
  });
}

export function useCreateKilai() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateKilaiDto) => kilaiApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kilais'] });
    },
  });
}

export function useUpdateKilai() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateKilaiDto> }) =>
      kilaiApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kilais'] });
      queryClient.invalidateQueries({ queryKey: ['kilais', variables.id] });
    },
  });
}

export function useDeleteKilai() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => kilaiApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kilais'] });
    },
  });
}

export function useOfficeBearers(kilaiId: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: ['office-bearers', kilaiId, locale],
    queryFn: () => kilaiApi.getOfficeBearers(kilaiId, locale),
    enabled: !!kilaiId,
  });
}

export function useCreateOfficeBearer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kilaiId, data }: { kilaiId: string; data: any }) => kilaiApi.createOfficeBearer(kilaiId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['office-bearers', variables.kilaiId] });
      queryClient.invalidateQueries({ queryKey: ['kilais', variables.kilaiId] });
    },
  });
}

export function useUpdateOfficeBearer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kilaiId, bearerId, data }: { kilaiId: string; bearerId: string; data: any }) =>
      kilaiApi.updateOfficeBearer(kilaiId, bearerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['office-bearers', variables.kilaiId] });
    },
  });
}

export function useDeleteOfficeBearer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kilaiId, bearerId }: { kilaiId: string; bearerId: string }) =>
      kilaiApi.deleteOfficeBearer(kilaiId, bearerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['office-bearers', variables.kilaiId] });
      queryClient.invalidateQueries({ queryKey: ['kilais', variables.kilaiId] });
    },
  });
}
