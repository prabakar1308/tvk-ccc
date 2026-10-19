'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRoles } from '@/hooks/use-roles';
import { useUser } from '@/contexts/user-context';
import { cadreApi, Cadre } from '@/services/api/cadres';
import { Shield, ShieldCheck, UserCog, Settings2, Sparkles } from 'lucide-react';

import { MobileTabNav, TabKey } from './components/mobile-tab-nav';
import { GeneralTab } from './components/general-tab';
import { SystemRolesTab } from './components/system-roles-tab';
import { RoleAssignmentTab } from './components/role-assignment-tab';

export default function SettingsPage() {
  const { roles, permissions, isLoading, updatePermissions, isUpdating, assignRole, isAssigning } = useRoles();
  const { hasPermission } = useUser();

  const [activeTab, setActiveTab] = useState<TabKey>('roles');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [localPermissions, setLocalPermissions] = useState<string[]>([]);
  
  // State for Role Assignment Tab
  const [selectedCadres, setSelectedCadres] = useState<Cadre[]>([]);
  const [assignRoleId, setAssignRoleId] = useState<string>('');

  // Tier ranking helper: Tier 1 (Super Admin) to Tier 5 (Cadre)
  const getRoleTierRank = (role: any): number => {
    const name = (role?.name || '').toUpperCase().trim();
    if (name === 'SUPER_ADMIN') return 1;
    if (name === 'DISTRICT_LEADER' || name.includes('DISTRICT')) return 2;
    if (name === 'UNION_LEADER' || name.includes('UNION')) return 3;
    if (name === 'KILAI_LEADER' || name.includes('KILAI')) return 4;
    if (name === 'CADRE' || name.includes('CADRE')) return 5;
    if (role?.priority !== undefined && role?.priority !== null) {
      return 1000 - role.priority;
    }
    return 99;
  };

  // 1. Sort system roles based on Tier
  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => getRoleTierRank(a) - getRoleTierRank(b));
  }, [roles]);

  // 2. Remove District and Users module from permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p: any) => {
      const mod = (p.module || 'System').toLowerCase().trim();
      return mod !== 'district' && mod !== 'districts' && mod !== 'user' && mod !== 'users';
    });
  }, [permissions]);

  useEffect(() => {
    if (sortedRoles && sortedRoles.length > 0 && !selectedRole) {
      setSelectedRole(sortedRoles[0].id);
    }
  }, [sortedRoles, selectedRole]);

  useEffect(() => {
    if (selectedRole && sortedRoles) {
      const role = sortedRoles.find((r: any) => r.id === selectedRole);
      if (role) {
        setLocalPermissions(role.permissions.map((rp: any) => rp.permission.id));
      }
    }
  }, [selectedRole, sortedRoles]);

  const currentRoleSavedPerms = useMemo(() => {
    const role = sortedRoles.find((r: any) => r.id === selectedRole);
    return role ? role.permissions.map((rp: any) => rp.permission.id) : [];
  }, [selectedRole, sortedRoles]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRole) return false;
    if (localPermissions.length !== currentRoleSavedPerms.length) return true;
    return localPermissions.some(id => !currentRoleSavedPerms.includes(id));
  }, [localPermissions, currentRoleSavedPerms, selectedRole]);

  const handleToggle = (permissionId: string, checked: boolean) => {
    setLocalPermissions(prev => 
      checked ? [...prev, permissionId] : prev.filter(id => id !== permissionId)
    );
  };

  const handleGlobalSelectAll = (checked: boolean) => {
    if (checked) {
      setLocalPermissions(filteredPermissions.map((p: any) => p.id));
    } else {
      setLocalPermissions([]);
    }
  };

  // 3. Side menu list ordering: Dashboard -> Unions -> Kilais -> Cadres -> Wings -> Booths -> Announcements -> Analytics -> Reports -> Settings
  const SIDEBAR_MODULE_ORDER: Record<string, number> = {
    dashboard: 1,
    home: 1,
    unions: 2,
    union: 2,
    kilais: 3,
    kilai: 3,
    cadres: 4,
    cadre: 4,
    wings: 5,
    wing: 5,
    booths: 6,
    booth: 6,
    announcements: 7,
    announcement: 7,
    analytics: 8,
    analytic: 8,
    reports: 9,
    report: 9,
    settings: 10,
    setting: 10,
    audit: 11,
  };

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredPermissions.forEach((p: any) => {
      const mod = p.module || 'System';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });

    // Sort module keys based on sidebar order
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const rankA = SIDEBAR_MODULE_ORDER[a.toLowerCase().trim()] ?? 99;
      const rankB = SIDEBAR_MODULE_ORDER[b.toLowerCase().trim()] ?? 99;
      return rankA - rankB;
    });

    const sortedGroups: Record<string, any[]> = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });
    return sortedGroups;
  }, [filteredPermissions]);

  const handleModuleSelectAll = (moduleName: string, checked: boolean) => {
    const modulePermIds = (groupedPermissions[moduleName] || []).map(p => p.id);
    if (checked) {
      setLocalPermissions(prev => Array.from(new Set([...prev, ...modulePermIds])));
    } else {
      setLocalPermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
    }
  };

  const handleSave = () => {
    if (selectedRole) {
      updatePermissions({ roleId: selectedRole, permissionIds: localPermissions });
    }
  };

  const handleAssignRole = () => {
    if (selectedCadres.length > 0 && assignRoleId) {
      assignRole(
        { cadreIds: selectedCadres.map(c => c.id), roleId: assignRoleId === 'remove' ? null : assignRoleId },
        {
          onSuccess: () => {
            setSelectedCadres([]);
            setAssignRoleId('');
          }
        }
      );
    }
  };

  const fetchCadres = async (search: string) => {
    const data = await cadreApi.getAll({ search, limit: '20' });
    return data.filter(cadre => cadre.user?.role?.name !== 'SUPER_ADMIN');
  };

  if (!hasPermission('settings:read')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
          <ShieldCheck className="w-10 h-10 opacity-70" />
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          You do not have the required administrative permissions to view the Settings module. Please contact your system administrator if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-16">
      {/* Executive Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent p-4 sm:p-5 rounded-2xl border border-[#8F0A1B]/15 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-[#8F0A1B]/15 text-[#8F0A1B] dark:text-red-400 border border-[#8F0A1B]/20">
              <Sparkles className="w-3 h-3 text-[#FFC72C]" />
              System Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            Settings & Access Control
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm font-medium">
            Configure system security policies, manage role-based permissions, and assign cadre privileges
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-2 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#8F0A1B]" />
            <span>{sortedRoles.length} Roles Defined</span>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)} className="w-full space-y-6">
        {/* MOBILE ONLY: Single Visible Tab Card with Left/Right Arrow Navigation */}
        <MobileTabNav 
          activeTab={activeTab} 
          onChangeTab={setActiveTab}
          rolesCount={sortedRoles.length}
          queuedCadresCount={selectedCadres.length}
        />

        {/* DESKTOP / TABLET ONLY: Full Horizontal Tabs Bar */}
        <div className="hidden sm:block w-full">
          <TabsList className="flex w-full sm:w-auto p-1.5 h-auto bg-gradient-to-r from-zinc-100/90 via-white to-red-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-xs gap-1.5 backdrop-blur-md">
            <TabsTrigger 
              value="general" 
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-4.5 rounded-xl text-sm sm:text-base font-bold transition-all whitespace-nowrap data-active:bg-gradient-to-r data-active:from-[#8F0A1B] data-active:to-[#B81930] data-active:text-white data-active:shadow-md data-active:shadow-[#8F0A1B]/20 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer h-auto"
            >
              <Settings2 className="w-4.5 h-4.5 shrink-0" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-4.5 rounded-xl text-sm sm:text-base font-bold transition-all whitespace-nowrap data-active:bg-gradient-to-r data-active:from-[#8F0A1B] data-active:to-[#B81930] data-active:text-white data-active:shadow-md data-active:shadow-[#8F0A1B]/20 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer h-auto"
            >
              <Shield className="w-4.5 h-4.5 shrink-0" />
              <span>System Roles</span>
              {sortedRoles.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {sortedRoles.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="user-roles" 
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-4.5 rounded-xl text-sm sm:text-base font-bold transition-all whitespace-nowrap data-active:bg-gradient-to-r data-active:from-[#8F0A1B] data-active:to-[#B81930] data-active:text-white data-active:shadow-md data-active:shadow-[#8F0A1B]/20 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer h-auto"
            >
              <UserCog className="w-4.5 h-4.5 shrink-0" />
              <span>Role Assignment</span>
              {selectedCadres.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-mono bg-[#FFC72C] text-[#8F0A1B] font-extrabold animate-pulse">
                  {selectedCadres.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* ========================================================================= */}
        {/* TAB 0: GENERAL SETTINGS */}
        {/* ========================================================================= */}
        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 1: SYSTEM ROLES & PERMISSIONS */}
        {/* ========================================================================= */}
        <TabsContent value="roles">
          <SystemRolesTab 
            roles={sortedRoles}
            permissions={filteredPermissions}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            localPermissions={localPermissions}
            handleToggle={handleToggle}
            handleGlobalSelectAll={handleGlobalSelectAll}
            handleModuleSelectAll={handleModuleSelectAll}
            groupedPermissions={groupedPermissions}
            handleSave={handleSave}
            isUpdating={isUpdating}
            hasUnsavedChanges={hasUnsavedChanges}
            hasWritePermission={hasPermission('settings:write')}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: ROLE ASSIGNMENT TO CADRES */}
        {/* ========================================================================= */}
        <TabsContent value="user-roles">
          <RoleAssignmentTab 
            roles={sortedRoles}
            selectedCadres={selectedCadres}
            setSelectedCadres={setSelectedCadres}
            assignRoleId={assignRoleId}
            setAssignRoleId={setAssignRoleId}
            handleAssignRole={handleAssignRole}
            isAssigning={isAssigning}
            fetchCadres={fetchCadres}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
