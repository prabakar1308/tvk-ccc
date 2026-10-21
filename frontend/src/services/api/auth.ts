import { fetchWithAuth } from './client';

export interface UserRole {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  scopeLevel: string;
  priority: number;
  permissions?: {
    permission: {
      id: string;
      action: string;
      description?: string | null;
      module?: string | null;
    };
  }[];
}

export interface UserCadre {
  id: string;
  memberId: string;
  name: string;
  phone?: string | null;
  aadhaarNumber?: string | null;
  voterId?: string | null;
  photoUrl?: string | null;
  role?: string | null;
  area?: string | null;
  boothNo?: string | null;
  level: string;
  districtId?: string | null;
  district?: {
    id: string;
    name: string;
  } | null;
  unionId?: string | null;
  union?: {
    id: string;
    name: string;
  } | null;
  homeKilaiId?: string | null;
  homeKilai?: {
    id: string;
    name: string;
  } | null;
  wingId?: string | null;
  wing?: {
    id: string;
    name: string;
  } | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  roleId?: string | null;
  role?: UserRole | null;
  cadreId?: string | null;
  cadre?: UserCadre | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export const authApi = {
  getMe: async (): Promise<UserProfile> => {
    const res = await fetchWithAuth('/api/v1/auth/me');
    return res.json();
  },

  changePassword: async (data: ChangePasswordDto): Promise<ChangePasswordResponse> => {
    const res = await fetchWithAuth('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
