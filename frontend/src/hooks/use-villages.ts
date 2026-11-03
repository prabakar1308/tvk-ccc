import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  villageApi,
  Village,
  CreateVillageDto,
} from '@/services/api/villages';

export function useVillages(panchayatId?: string, search?: string) {
  return useQuery({
    queryKey: ['villages', { panchayatId, search }],
    queryFn: () => villageApi.getAll(panchayatId, search),
  });
}

export function useVillage(id: string) {
  return useQuery({
    queryKey: ['villages', id],
    queryFn: () => villageApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateVillage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVillageDto) => villageApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['villages'] });
      queryClient.invalidateQueries({ queryKey: ['panchayats', variables.panchayatId] });
      queryClient.invalidateQueries({ queryKey: ['panchayats'] });
    },
  });
}

export function useUpdateVillage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateVillageDto> }) =>
      villageApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['villages'] });
      queryClient.invalidateQueries({ queryKey: ['villages', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['panchayats'] });
    },
  });
}

export function useDeleteVillage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => villageApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['villages'] });
      queryClient.invalidateQueries({ queryKey: ['panchayats'] });
    },
  });
}
