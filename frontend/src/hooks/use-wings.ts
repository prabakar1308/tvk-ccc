import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { wingsApi, AssignWingMemberDto } from '@/services/api/wings';

export function useWings(level?: string, orgId?: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: ['wings', level, orgId, locale],
    queryFn: () => wingsApi.getAll(level, orgId),
  });
}

export function useWingMembers(wingId: string, level: string, orgId: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: ['wings', wingId, 'members', level, orgId, locale],
    queryFn: () => wingsApi.getMembers(wingId, level, orgId),
    enabled: !!wingId && !!level && !!orgId,
  });
}

export function useAssignWingMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ wingId, data }: { wingId: string; data: AssignWingMemberDto }) => 
      wingsApi.assignMember(wingId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wings', variables.wingId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['cadres'] }); // also invalidate cadres since their role is updated
    },
  });
}

export function useRemoveWingMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cadreId }: { cadreId: string }) => wingsApi.removeMember(cadreId),
    onSuccess: () => {
      // Invalidate all wing members since we don't know the exact wingId from just cadreId in this hook cleanly
      queryClient.invalidateQueries({ queryKey: ['wings'] });
      queryClient.invalidateQueries({ queryKey: ['cadres'] });
    },
  });
}
