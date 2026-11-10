import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  electionsApi,
  Election,
  CreateElectionDto,
  UpdateElectionDto,
} from '@/services/api/elections';

export const ELECTIONS_QUERY_KEY = ['elections'];

export function useElections() {
  return useQuery({
    queryKey: ELECTIONS_QUERY_KEY,
    queryFn: () => electionsApi.getAll(),
  });
}

export function useCurrentElection() {
  return useQuery({
    queryKey: [...ELECTIONS_QUERY_KEY, 'current'],
    queryFn: () => electionsApi.getCurrent(),
  });
}

export function useCreateElection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateElectionDto) => electionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ELECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useUpdateElection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateElectionDto }) =>
      electionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ELECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useSetCurrentElection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => electionsApi.setCurrent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ELECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useDeleteElection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => electionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ELECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

