import { fetchWithAuth } from './client';

export const rolesApi = {
  getRoles: async () => {
    const res = await fetchWithAuth('/api/v1/roles');
    return res.json();
  },

  getPermissions: async () => {
    const res = await fetchWithAuth('/api/v1/roles/permissions');
    return res.json();
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    const res = await fetchWithAuth(`/api/v1/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionIds }),
    });
    return res.json();
  },

  assignRoleToCadres: async (cadreIds: string[], roleId: string | null) => {
    const res = await fetchWithAuth(`/api/v1/roles/assign`, {
      method: 'POST',
      body: JSON.stringify({ cadreIds, roleId }),
    });
    return res.json();
  },
};
