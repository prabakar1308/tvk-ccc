import { fetchWithAuth } from './client';
import { Cadre } from './cadres'; // Assuming a Cadre interface exists, or just use any/defined here.

export interface Wing {
  id: string;
  name: string;
  color: string;
  textColor: string;
  iconName: string;
  order: number;
}

export interface AssignWingMemberDto {
  cadreId: string;
  role: 'COORDINATOR' | 'CO_COORDINATOR';
  level: 'DISTRICT' | 'UNION';
  districtId?: string;
  unionId?: string;
}

export const wingsApi = {
  getAll: async (level?: string, orgId?: string): Promise<Wing[]> => {
    let url = '/api/v1/wings';
    if (level && orgId) {
      const params = new URLSearchParams({
        level: level.toUpperCase(),
      });
      if (level === 'district') {
        params.append('districtId', orgId);
      } else if (level === 'union') {
        params.append('unionId', orgId);
      }
      url += `?${params.toString()}`;
    }
    const res = await fetchWithAuth(url);
    return res.json();
  },

  getMembers: async (wingId: string, level: string, orgId: string): Promise<any[]> => {
    const params = new URLSearchParams({
      level: level.toUpperCase(),
    });
    
    if (level === 'district') {
      params.append('districtId', orgId);
    } else if (level === 'union') {
      params.append('unionId', orgId);
    }

    const res = await fetchWithAuth(`/api/v1/wings/${wingId}/members?${params.toString()}`);
    return res.json();
  },

  assignMember: async (wingId: string, data: AssignWingMemberDto): Promise<any> => {
    const res = await fetchWithAuth(`/api/v1/wings/${wingId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  removeMember: async (cadreId: string): Promise<void> => {
    await fetchWithAuth(`/api/v1/wings/members/${cadreId}`, {
      method: 'DELETE',
    });
  },
};
