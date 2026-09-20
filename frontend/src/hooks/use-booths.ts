import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boothApi, Booth, CreateBoothDto } from '@/services/api/booths';

export function useBooths() {
  return useQuery({
    queryKey: ['booths'],
    queryFn: boothApi.getAll,
  });
}

export function useBoothAreas() {
  return useQuery({
    queryKey: ['booth-areas'],
    queryFn: boothApi.getAreas,
  });
}

export function useBooth(id: string) {
  return useQuery({
    queryKey: ['booths', id],
    queryFn: () => boothApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBooth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBoothDto) => boothApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useUpdateBooth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBoothDto> }) => boothApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
      queryClient.invalidateQueries({ queryKey: ['booths', variables.id] });
    },
  });
}

export function useDeleteBooth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => boothApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}
