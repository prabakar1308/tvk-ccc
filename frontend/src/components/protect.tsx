'use client';

import React from 'react';
import { useUser } from '@/contexts/user-context';

interface ProtectProps {
  require: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Protect({ require, children, fallback = null }: ProtectProps) {
  const { hasPermission } = useUser();
  
  if (hasPermission(require)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
