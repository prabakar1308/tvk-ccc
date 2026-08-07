import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unionApi, Union, CreateUnionDto } from '@/services/api/unions';

export function useUnions() {
  return useQuery({
    queryKey: ['unions'],
    queryFn: unionApi.getAll,
  });
}

export function useUnion(id: string) {
  return useQuery({
    queryKey: ['unions', id],
    queryFn: () => unionApi.getById(id),
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
