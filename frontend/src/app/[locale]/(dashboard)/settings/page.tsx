'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MultiAutocomplete } from '@/components/ui/autocomplete';
import { useRoles } from '@/hooks/use-roles';
import { useUser } from '@/contexts/user-context';
import { cadreApi, Cadre } from '@/services/api/cadres';
import { Shield, Users, Save, ShieldCheck, UserCog, Settings2 } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('UnderConstruction');
  const { roles, permissions, isLoading, updatePermissions, isUpdating, assignRole, isAssigning } = useRoles();
  const { hasPermission } = useUser();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [localPermissions, setLocalPermissions] = useState<string[]>([]);
  
  // State for Role Assignment Tab
  const [selectedCadres, setSelectedCadres] = useState<Cadre[]>([]);
  const [assignRoleId, setAssignRoleId] = useState<string>('');

  useEffect(() => {
    if (roles && roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0].id);
    }
  }, [roles, selectedRole]);

  useEffect(() => {
    if (selectedRole && roles) {
      const role = roles.find((r: any) => r.id === selectedRole);
      if (role) {
        setLocalPermissions(role.permissions.map((rp: any) => rp.permission.id));
      }
    }
  }, [selectedRole, roles]);

  const handleToggle = (permissionId: string, checked: boolean) => {
    setLocalPermissions(prev => 
      checked ? [...prev, permissionId] : prev.filter(id => id !== permissionId)
    );
  };

  const handleGlobalSelectAll = (checked: boolean) => {
    if (checked) {
      setLocalPermissions(permissions.map((p: any) => p.id));
    } else {
      setLocalPermissions([]);
    }
  };

  const handleModuleSelectAll = (moduleName: string, checked: boolean) => {
    const modulePermIds = groupedPermissions[moduleName].map(p => p.id);
    if (checked) {
      setLocalPermissions(prev => Array.from(new Set([...prev, ...modulePermIds])));
    } else {
      setLocalPermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
    }
  };

  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    permissions.forEach((p: any) => {
      const mod = p.module || 'System';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });
    return groups;
  }, [permissions]);

  const handleSave = () => {
    if (selectedRole) {
      updatePermissions({ roleId: selectedRole, permissionIds: localPermissions });
    }
  };

  const handleAssignRole = () => {
    if (selectedCadres.length > 0 && assignRoleId) {
      assignRole(
        { cadreIds: selectedCadres.map(c => c.id), roleId: assignRoleId },
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <ShieldCheck className="w-16 h-16 text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You do not have the required permissions to view the Settings module. Please contact your system administrator if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold uppercase tracking-wide text-primary">Settings</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Manage application settings and access control</p>
        </div>
      </div>
      
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-3 p-1 bg-muted/50 rounded-lg">
          <TabsTrigger value="general" className="flex gap-2 rounded-md transition-all">
            <Settings2 className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex gap-2 rounded-md transition-all">
            <Shield className="w-4 h-4" /> System Roles
          </TabsTrigger>
          <TabsTrigger value="user-roles" className="flex gap-2 rounded-md transition-all">
            <Users className="w-4 h-4" /> Role Assignment
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('settingsMsg')}</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="bg-muted/10 border-b pb-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">System Roles & Permissions</CardTitle>
                    <CardDescription>Configure which actions each role can perform across the system.</CardDescription>
                  </div>
                </div>
                {hasPermission('settings:write') && (
                  <Button onClick={handleSave} disabled={isUpdating || !selectedRole} className="flex gap-2">
                    <Save className="w-4 h-4" />
                    {isUpdating ? 'Saving...' : 'Save Permissions'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center p-8">Loading...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Roles Sidebar */}
                  <div className="col-span-1 space-y-2">
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Roles</h3>
                    {roles.map((role: any) => (
                      <div 
                        key={role.id} 
                        onClick={() => setSelectedRole(role.id)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${selectedRole === role.id ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted'}`}
                      >
                        {role.name}
                      </div>
                    ))}
                  </div>

                  {/* Permissions Grid */}
                  <div className="col-span-1 md:col-span-3 space-y-6">
                    {(() => {
                      const activeRole = roles.find((r: any) => r.id === selectedRole);
                      const isSystemSuperAdmin = activeRole?.name === 'SUPER_ADMIN';
                      const isGlobalAllSelected = permissions.length > 0 && localPermissions.length === permissions.length;

                      return (
                        <>
                          <div className="flex justify-end items-center bg-muted/30 p-3 rounded-lg border border-border/50">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="global-select-all" 
                                checked={isSystemSuperAdmin ? true : isGlobalAllSelected}
                                onCheckedChange={(checked) => handleGlobalSelectAll(!!checked)}
                                disabled={isSystemSuperAdmin || permissions.length === 0}
                              />
                              <label htmlFor="global-select-all" className="text-sm font-semibold cursor-pointer">
                                Select All Permissions
                              </label>
                            </div>
                          </div>

                          {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                            const modulePermIds = perms.map((p: any) => p.id);
                            const isModuleAllSelected = modulePermIds.every((id: string) => localPermissions.includes(id));

                            return (
                              <div key={moduleName} className="border border-border/50 rounded-lg overflow-hidden bg-card shadow-sm">
                                <div className="bg-muted/40 px-4 py-3 border-b border-border/50 flex items-center justify-between">
                                  <h4 className="font-semibold text-foreground uppercase tracking-wider text-sm flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                    {moduleName} Module
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`mod-select-all-${moduleName}`}
                                      checked={isSystemSuperAdmin ? true : isModuleAllSelected}
                                      onCheckedChange={(checked) => handleModuleSelectAll(moduleName, !!checked)}
                                      disabled={isSystemSuperAdmin}
                                    />
                                    <label htmlFor={`mod-select-all-${moduleName}`} className="text-xs font-semibold cursor-pointer">
                                      Select All
                                    </label>
                                  </div>
                                </div>
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {perms.map((perm: any) => {
                              const isChecked = localPermissions.includes(perm.id);
                              const actionName = (perm.action.split(':').pop() || perm.action).replace(/-/g, ' ');
                              const displayAction = actionName.charAt(0).toUpperCase() + actionName.slice(1);

                              return (
                                <div 
                                  key={perm.id} 
                                  className={`flex items-start space-x-3 p-3 rounded-md transition-colors border ${isChecked ? 'bg-primary/5 border-primary/20' : 'bg-background border-transparent hover:border-border hover:bg-muted/20'}`}
                                >
                                  <Checkbox 
                                    id={`perm-${perm.id}`}
                                    checked={isSystemSuperAdmin ? true : isChecked} 
                                    disabled={isSystemSuperAdmin}
                                    onCheckedChange={(checked) => handleToggle(perm.id, !!checked)}
                                    className="mt-1"
                                  />
                                  <div className="space-y-1.5">
                                    <label 
                                      htmlFor={`perm-${perm.id}`} 
                                      className="text-sm font-semibold leading-none cursor-pointer flex items-center gap-2"
                                    >
                                      {displayAction}
                                    </label>
                                    <p className="text-xs text-muted-foreground leading-snug">
                                      {perm.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                            );
                          })}
                        </>
                      );
                    })()}
                    
                    {permissions.length === 0 && (
                      <div className="text-center p-8 border rounded-lg text-muted-foreground bg-muted/20">
                        No permissions defined in the system.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="user-roles" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="bg-muted/10 border-b pb-4">
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <UserCog className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Assign Role to Cadres</CardTitle>
                  <CardDescription>Search and select multiple cadres to quickly grant them system access.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" /> Select Cadres
                    </label>
                    <MultiAutocomplete<Cadre>
                      value={selectedCadres}
                      onChange={setSelectedCadres}
                      fetchOptions={fetchCadres}
                      getOptionLabel={(cadre) => {
                        const location = cadre.homeKilai?.name || cadre.union?.name || '';
                        return `${cadre.name} (${cadre.memberId})${location ? ` - ${location}` : ''}`;
                      }}
                      getOptionValue={(cadre) => cadre.id}
                      placeholder="Search by name, member ID..."
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" /> Select System Role
                    </label>
                    <select 
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                      value={assignRoleId}
                      onChange={(e) => setAssignRoleId(e.target.value)}
                    >
                      <option value="" disabled>Select an action or role...</option>
                      <option value="remove" className="text-red-600 font-bold">-- Remove Role / Revoke Access --</option>
                      {roles.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name} - {r.description}</option>
                      ))}
                    </select>
                  </div>
                  
                  <Button 
                    onClick={handleAssignRole} 
                    disabled={selectedCadres.length === 0 || !assignRoleId || isAssigning}
                    className="w-full flex items-center gap-2 h-11 text-base font-medium"
                    variant={assignRoleId === 'remove' ? 'destructive' : 'default'}
                    size="lg"
                  >
                    <Save className="w-4 h-4" />
                    {isAssigning 
                      ? 'Processing...' 
                      : assignRoleId === 'remove'
                        ? `Revoke Access for ${selectedCadres.length} Cadre(s)`
                        : `Assign Role to ${selectedCadres.length} Cadre(s)`}
                  </Button>
                </div>

                {/* Right side: Selected Cadres List */}
                <div className="border rounded-lg bg-muted/20 flex flex-col h-full overflow-hidden min-h-[300px]">
                  <div className="bg-muted/50 p-3 border-b text-sm font-medium flex justify-between items-center">
                    <span>Selected Cadres</span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{selectedCadres.length}</span>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
                    {selectedCadres.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                        <Users className="w-12 h-12 mb-3" />
                        <p className="text-sm">No cadres selected yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedCadres.map(c => (
                          <div key={c.id} className="flex justify-between items-center p-3 bg-background border rounded-md shadow-sm">
                            <div>
                              <p className="font-medium text-sm">{c.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center flex-wrap gap-1 mt-1">
                                <span>{c.memberId}</span>
                                <span>•</span>
                                <span>{c.role || 'Member'}</span>
                                {c.homeKilai?.name || c.union?.name ? (
                                  <>
                                    <span>•</span>
                                    <span>{c.homeKilai?.name || c.union?.name}</span>
                                  </>
                                ) : null}
                                {c.user?.role?.name && (
                                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-[10px]">
                                    {c.user.role.name}
                                  </span>
                                )}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedCadres(selectedCadres.filter(sc => sc.id !== c.id))} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
