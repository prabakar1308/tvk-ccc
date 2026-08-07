import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kilaiApi, Kilai, CreateKilaiDto } from '@/services/api/kilais';

export function useKilais() {
  return useQuery({
    queryKey: ['kilais'],
    queryFn: kilaiApi.getAll,
  });
}



export function useKilai(id: string) {
  return useQuery({
    queryKey: ['kilais', id],
    queryFn: () => kilaiApi.getById(id),
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
  return useQuery({
    queryKey: ['office-bearers', kilaiId],
    queryFn: () => kilaiApi.getOfficeBearers(kilaiId),
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
