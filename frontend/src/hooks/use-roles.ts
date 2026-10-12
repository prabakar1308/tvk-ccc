import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../services/api/roles';

export function useRoles() {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getRoles,
  });

  const permissionsQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: rolesApi.getPermissions,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesApi.updateRolePermissions(roleId, permissionIds),
    meta: {
      successMessage: 'Permissions Updated',
      successDescription: 'Role permissions have been saved successfully.',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ cadreIds, roleId }: { cadreIds: string[]; roleId: string | null }) =>
      rolesApi.assignRoleToCadres(cadreIds, roleId),
    meta: {
      successMessage: 'Role Assigned',
      successDescription: 'The role has been successfully assigned to the selected cadres.',
    },
    onSuccess: () => {
      // maybe invalidate cadres list or roles
    },
  });

  return {
    roles: rolesQuery.data || [],
    permissions: permissionsQuery.data || [],
    isLoading: rolesQuery.isLoading || permissionsQuery.isLoading,
    updatePermissions: updatePermissionsMutation.mutate,
    isUpdating: updatePermissionsMutation.isPending,
    assignRole: assignRoleMutation.mutate,
    isAssigning: assignRoleMutation.isPending,
  };
}
