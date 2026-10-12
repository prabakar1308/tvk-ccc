import { Prisma } from '@prisma/client';

export interface UserWithCadreAndRole {
  role: {
    name: string;
    scopeLevel: 'GLOBAL' | 'DISTRICT' | 'UNION' | 'KILAI';
    priority: number;
  };
  cadre?: {
    districtId?: string | null;
    unionId?: string | null;
    homeKilaiId?: string | null;
    wingId?: string | null;
  } | null;
}

export function getOrgUnitScope(user: UserWithCadreAndRole): Prisma.CadreWhereInput {
  const level = user.role.scopeLevel;
  const isWingRole = user.role.name.includes('COORDINATOR');

  const scope: Prisma.CadreWhereInput = {};

  if (!user.cadre) {
    if (level !== 'GLOBAL') {
      return { id: 'NO_ACCESS_NO_CADRE' };
    }
    return scope;
  }

  // 1. Geographical Scoping
  if (level === 'DISTRICT' && user.cadre.districtId) {
    scope.districtId = user.cadre.districtId;
  } else if (level === 'UNION' && user.cadre.unionId) {
    scope.unionId = user.cadre.unionId;
  } else if (level === 'KILAI' && user.cadre.homeKilaiId) {
    scope.homeKilaiId = user.cadre.homeKilaiId;
  } else if (level !== 'GLOBAL') {
    return { id: 'NO_ACCESS_INVALID_SCOPE' };
  }

  // 2. Wing Scoping (Horizontal Restriction)
  if (isWingRole && user.cadre.wingId) {
    scope.wingId = user.cadre.wingId;
  }

  return scope;
}

export function canEditCadre(currentUser: UserWithCadreAndRole, targetUserPriority: number): boolean {
  return targetUserPriority <= currentUser.role.priority;
}
