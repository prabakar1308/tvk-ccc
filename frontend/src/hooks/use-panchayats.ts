import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  panchayatApi,
  Panchayat,
  CreatePanchayatDto,
} from '@/services/api/panchayats';

export function usePanchayats(
  unionId?: string,
  search?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['panchayats', { unionId, search }],
    queryFn: () => panchayatApi.getAll(unionId, search),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });
}

export function usePanchayat(idOrSlug: string) {
  return useQuery({
    queryKey: ['panchayats', idOrSlug],
    queryFn: () => panchayatApi.getById(idOrSlug),
    enabled: !!idOrSlug,
  });
}

export function useCreatePanchayat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePanchayatDto) => panchayatApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['panchayats'] });
      queryClient.invalidateQueries({ queryKey: ['unions', variables.unionId] });
      queryClient.invalidateQueries({ queryKey: ['unions'] });
    },
  });
}

export function useUpdatePanchayat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePanchayatDto> }) =>
      panchayatApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['panchayats'] });
      queryClient.invalidateQueries({ queryKey: ['panchayats', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['unions'] });
    },
  });
}

export function useUpdatePanchayatGeo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      geoData,
    }: {
      id: string;
      geoData: { centerLat?: number; centerLng?: number; boundary?: any };
    }) => panchayatApi.updateGeo(id, geoData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['panchayats', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['panchayats'] });
    },
  });
}

export function useDeletePanchayat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => panchayatApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panchayats'] });
      queryClient.invalidateQueries({ queryKey: ['unions'] });
    },
  });
}
