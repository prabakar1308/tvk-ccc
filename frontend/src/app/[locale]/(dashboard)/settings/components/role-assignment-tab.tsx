'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MultiAutocomplete } from '@/components/ui/autocomplete';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Cadre } from '@/services/api/cadres';
import { UserCog, Users, Shield, Save, Trash2 } from 'lucide-react';

interface RoleAssignmentTabProps {
  roles: any[];
  selectedCadres: Cadre[];
  setSelectedCadres: React.Dispatch<React.SetStateAction<Cadre[]>>;
  assignRoleId: string;
  setAssignRoleId: (id: string) => void;
  handleAssignRole: () => void;
  isAssigning: boolean;
  fetchCadres: (search: string) => Promise<Cadre[]>;
}

export function RoleAssignmentTab({
  roles,
  selectedCadres,
  setSelectedCadres,
  assignRoleId,
  setAssignRoleId,
  handleAssignRole,
  isAssigning,
  fetchCadres,
}: RoleAssignmentTabProps) {
  const getRoleTierLabel = (name: string) => {
    switch (name) {
      case 'SUPER_ADMIN':
        return 'Tier 1 • Super Administrator';
      case 'DISTRICT_LEADER':
        return 'Tier 2 • District Leader';
      case 'UNION_LEADER':
        return 'Tier 3 • Union Leader';
      case 'KILAI_LEADER':
        return 'Tier 4 • Kilai Leader';
      case 'CADRE':
        return 'Tier 5 • Cadre';
      default:
        return name ? name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-md overflow-hidden bg-card">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-zinc-50 to-[#FFC72C]/5 dark:from-primary/10 dark:via-zinc-900 dark:to-transparent border-b border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-6">
          <div className="flex gap-3 items-center">
            <div className="p-2.5 bg-[#8F0A1B] text-white rounded-xl shadow-xs shrink-0">
              <UserCog className="w-6 h-6 text-[#FFC72C]" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                Assign System Roles to Cadres
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1 text-zinc-600 dark:text-zinc-400">
                Batch-grant dashboard access or revoke administrator privileges for party cadres
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl">
            {/* Left Form: Search & Selection */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Search & Select Cadres
                  </span>
                  {selectedCadres.length > 0 && (
                    <span className="text-xs font-mono text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10">
                      {selectedCadres.length} selected
                    </span>
                  )}
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
                  placeholder="Search administrator by name, member ID..."
                  className="rounded-xl shadow-xs text-sm sm:text-base"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Type 3 or more characters to search party cadres across the constituency.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Select Target Role to Assign
                </label>
                <select 
                  className="flex h-12 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  value={assignRoleId}
                  onChange={(e) => setAssignRoleId(e.target.value)}
                >
                  <option value="" disabled>Choose an administrative role...</option>
                  <option value="remove" className="text-rose-600 font-bold">
                    ⚠️ Remove Role / Revoke Dashboard Access
                  </option>
                  {roles.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {getRoleTierLabel(r.name)} {r.description ? `— ${r.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button 
                onClick={handleAssignRole} 
                disabled={selectedCadres.length === 0 || !assignRoleId || isAssigning}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm sm:text-base font-bold shadow-md cursor-pointer transition-all active:scale-[0.98]"
                variant={assignRoleId === 'remove' ? 'destructive' : 'default'}
                size="lg"
              >
                <Save className="w-4.5 h-4.5" />
                {isAssigning 
                  ? 'Updating Role Assignments...' 
                  : assignRoleId === 'remove'
                    ? `Revoke Access for ${selectedCadres.length} Cadre(s)`
                    : `Assign Role to ${selectedCadres.length} Cadre(s)`}
              </Button>
            </div>

            {/* Right Column: Selected Cadres Queue */}
            <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col overflow-hidden min-h-[220px] md:min-h-[340px] shadow-xs">
              <div className="bg-zinc-100/80 dark:bg-zinc-850 px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800 flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  <Users className="w-4 h-4 text-primary" />
                  Assignment Queue
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-mono font-bold">
                    {selectedCadres.length}
                  </span>
                  {selectedCadres.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCadres([])}
                      className="text-xs font-bold text-muted-foreground hover:text-rose-600 cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 sm:p-4 flex-1 overflow-y-auto max-h-[380px]">
                {selectedCadres.length === 0 ? (
                  <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-muted-foreground text-center p-6">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-sm sm:text-base font-bold text-zinc-700 dark:text-zinc-300">No cadres in queue</p>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mt-0.5">
                      Use the search field on the left to select cadres for role updates
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedCadres.map(c => (
                      <div 
                        key={c.id} 
                        className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl shadow-2xs gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar 
                            src={c.photoUrl} 
                            name={c.name} 
                            size="sm" 
                            shape="square" 
                            ring="primary" 
                            elevation="sm" 
                          />
                          <div className="min-w-0">
                            <p className="font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                              {c.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs sm:text-[13px] text-muted-foreground flex-wrap mt-0.5">
                              <span className="font-mono font-bold text-zinc-600 dark:text-zinc-400">{c.memberId}</span>
                              <span>•</span>
                              <span className="font-medium">{c.role || 'Cadre'}</span>
                              {(c.homeKilai?.name || c.union?.name) && (
                                <>
                                  <span>•</span>
                                  <span className="truncate font-medium">{c.homeKilai?.name || c.union?.name}</span>
                                </>
                              )}
                              {c.user?.role?.name && (
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
                                  {c.user.role.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={() => setSelectedCadres(selectedCadres.filter(sc => sc.id !== c.id))} 
                          className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 rounded-lg shrink-0 cursor-pointer"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
