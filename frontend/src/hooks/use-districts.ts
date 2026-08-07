import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { districtApi, District, CreateDistrictDto } from '@/services/api/districts';

export function useDistricts() {
  return useQuery({
    queryKey: ['districts'],
    queryFn: districtApi.getAll,
  });
}

export function useDistrict(id: string) {
  return useQuery({
    queryKey: ['districts', id],
    queryFn: () => districtApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateDistrict() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDistrictDto) => districtApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
    },
  });
}

export function useUpdateDistrict() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDistrictDto> }) =>
      districtApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      queryClient.invalidateQueries({ queryKey: ['districts', variables.id] });
    },
  });
}

export function useDeleteDistrict() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => districtApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
    },
  });
}
