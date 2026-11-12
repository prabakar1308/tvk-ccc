import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  boothApi,
  CreateBoothDto,
  CreateBoothElectionResultDto,
  AgentAssignmentPayload,
  BoothDemographicsItem,
  BulkUpdateBoothElectionResultsDto,
} from '@/services/api/booths';

export function useBooths(params?: {
  unionId?: string;
  panchayatId?: string;
  villageId?: string;
}) {
  return useQuery({
    queryKey: ['booths', params],
    queryFn: () => boothApi.getAll(params),
    staleTime: 60 * 1000,
  });
}

export function useBoothAreas() {
  return useQuery({
    queryKey: ['booths', 'areas'],
    queryFn: () => boothApi.getAreas(),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBoothDto> }) =>
      boothApi.update(id, data),
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

export function useUpdateBoothDemographicsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: BoothDemographicsItem[]) =>
      boothApi.updateDemographicsBulk(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useUpdateBoothElectionResultsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: BulkUpdateBoothElectionResultsDto) =>
      boothApi.updateElectionResultsBulk(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useAddBoothElectionResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boothId,
      data,
    }: {
      boothId: string;
      data: CreateBoothElectionResultDto;
    }) => boothApi.addElectionResult(boothId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useUpdateBoothElectionResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boothId,
      resultId,
      data,
    }: {
      boothId: string;
      resultId: string;
      data: Partial<CreateBoothElectionResultDto>;
    }) => boothApi.updateElectionResult(boothId, resultId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useDeleteBoothElectionResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boothId,
      resultId,
    }: {
      boothId: string;
      resultId: string;
    }) => boothApi.deleteElectionResult(boothId, resultId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useAssignBoothElectionAgents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boothId,
      electionId,
      cadreIds,
      agents,
      role,
    }: {
      boothId: string;
      electionId: string;
      cadreIds?: string[];
      agents?: AgentAssignmentPayload[];
      role?: string;
    }) =>
      boothApi.assignElectionAgents(
        boothId,
        electionId,
        agents && agents.length > 0 ? agents : cadreIds || [],
        role,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useUpdateBoothElectionAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boothId,
      electionId,
      cadreId,
      data,
    }: {
      boothId: string;
      electionId: string;
      cadreId: string;
      data: {
        role?: string;
        blaFormUrl?: string | null;
        notes?: string;
        newCadreId?: string;
      };
    }) => boothApi.updateElectionAgent(boothId, electionId, cadreId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useAddBoothElectionAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boothId,
      electionId,
      cadreId,
      role,
    }: {
      boothId: string;
      electionId: string;
      cadreId: string;
      role?: string;
    }) => boothApi.addElectionAgent(boothId, electionId, cadreId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}

export function useRemoveBoothElectionAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boothId,
      electionId,
      cadreId,
    }: {
      boothId: string;
      electionId: string;
      cadreId: string;
    }) => boothApi.removeElectionAgent(boothId, electionId, cadreId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] });
    },
  });
}
