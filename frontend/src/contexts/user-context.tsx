'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@/services/api/auth';

export interface User {
  userId: string;
  sub: string;
  role: string | null;
  scopeLevel?: string | null;
  level?: string | null;
  unionId?: string | null;
  homeKilaiId?: string | null;
  districtId?: string | null;
  permissions?: string[];
  name?: string | null;
  photoUrl?: string | null;
  cadre?: any;
}

interface UserContextType {
  user: User | null;
  activeUnionId: string | null;
  setActiveUnionId: (id: string | null) => void;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeUnionId, setActiveUnionId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = document.cookie.split('; ').find(row => row.startsWith('tcc_auth_token='))?.split('=')[1];
    
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        setUser(decoded);
        if (decoded.role !== 'SUPER_ADMIN' && decoded.unionId) {
          setActiveUnionId(decoded.unionId);
        } else {
          const stored = localStorage.getItem('tcc_active_union_id');
          if (stored) setActiveUnionId(stored);
        }

        // Fetch fresh profile to populate complete cadre hierarchy (level, unionId, homeKilai)
        authApi.getMe().then((profile) => {
          if (profile) {
            const cadreUnionId = profile.cadre?.unionId || profile.cadre?.homeKilai?.unionId || null;
            setUser((prev) => ({
              ...prev!,
              role: profile.role?.name || prev?.role || null,
              scopeLevel: profile.role?.scopeLevel || prev?.scopeLevel || null,
              level: profile.cadre?.level || prev?.level || null,
              unionId: cadreUnionId || prev?.unionId || null,
              homeKilaiId: profile.cadre?.homeKilaiId || prev?.homeKilaiId || null,
              districtId: profile.cadre?.districtId || prev?.districtId || null,
              cadre: profile.cadre,
            }));
            if (profile.role?.name !== 'SUPER_ADMIN' && cadreUnionId) {
              setActiveUnionId(cadreUnionId);
            }
          }
        }).catch((err) => {
          console.error('Failed to load user profile in context', err);
        });
      } catch (err) {
        console.error('Invalid token', err);
      }
    }
  }, []);

  const handleSetActiveUnionId = (id: string | null) => {
    setActiveUnionId(id);
    if (id) {
      localStorage.setItem('tcc_active_union_id', id);
    } else {
      localStorage.removeItem('tcc_active_union_id');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    document.cookie = 'tcc_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    localStorage.removeItem('tcc_active_union_id');
    window.location.href = '/en/login';
  };

  const hasPermission = (permission: string) => {
    if (user?.role === 'SUPER_ADMIN') return true; // Super admin can do anything, or we can strictly rely on permissions. Let's rely on permissions.
    return user?.permissions?.includes(permission) ?? false;
  };

  if (!isMounted) return null;

  return (
    <UserContext.Provider value={{ user, activeUnionId, setActiveUnionId: handleSetActiveUnionId, hasPermission, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
