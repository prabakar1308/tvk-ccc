'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  userId: string;
  sub: string;
  role: string;
  unionId?: string;
}

interface UserContextType {
  user: User | null;
  activeUnionId: string | null;
  setActiveUnionId: (id: string | null) => void;
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

  const logout = () => {
    document.cookie = 'tcc_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    localStorage.removeItem('tcc_active_union_id');
    window.location.href = '/en/login';
  };

  if (!isMounted) return null;

  return (
    <UserContext.Provider value={{ user, activeUnionId, setActiveUnionId: handleSetActiveUnionId, logout }}>
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
