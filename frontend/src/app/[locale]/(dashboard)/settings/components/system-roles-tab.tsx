'use client';

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Shield, ShieldCheck, Save, AlertCircle, Layers, 
  Users, Building2, Store, MapPin, Settings2, BarChart2,
  Home, GitBranch, Bird, ClipboardList, FileText,
  ChevronLeft, ChevronRight
} from 'lucide-react';

interface SystemRolesTabProps {
  roles: any[];
  permissions: any[];
  selectedRole: string | null;
  setSelectedRole: (id: string) => void;
  localPermissions: string[];
  handleToggle: (permissionId: string, checked: boolean) => void;
  handleGlobalSelectAll: (checked: boolean) => void;
  handleModuleSelectAll: (moduleName: string, checked: boolean) => void;
  groupedPermissions: Record<string, any[]>;
  handleSave: () => void;
  isUpdating: boolean;
  hasUnsavedChanges: boolean;
  hasWritePermission: boolean;
  isLoading: boolean;
}

// Side menu list ordering: Dashboard -> Unions -> Kilais -> Cadres -> Wings -> Booths -> Announcements -> Analytics -> Reports -> Settings
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

export function SystemRolesTab({
  roles,
  permissions,
  selectedRole,
  setSelectedRole,
  localPermissions,
  handleToggle,
  handleGlobalSelectAll,
  handleModuleSelectAll,
  groupedPermissions,
  handleSave,
  isUpdating,
  hasUnsavedChanges,
  hasWritePermission,
  isLoading,
}: SystemRolesTabProps) {
  const activeRoleObj = roles.find((r: any) => r.id === selectedRole);
  const isSystemSuperAdmin = activeRoleObj?.name === 'SUPER_ADMIN';
  const isGlobalAllSelected = permissions.length > 0 && localPermissions.length >= permissions.length;

  const roleScrollRef = useRef<HTMLDivElement>(null);
  const roleWrapperRef = useRef<HTMLDivElement>(null);
  const roleItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = roleScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  // Listen to native scroll and resize to keep arrow states perfectly synchronized
  useEffect(() => {
    const el = roleScrollRef.current;
    if (!el) return;

    const handleScroll = () => checkScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      checkScroll();
    });
    ro.observe(el);

    // Initial checks (immediate and after DOM settles)
    checkScroll();
    const timer = setTimeout(checkScroll, 150);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      ro.disconnect();
      clearTimeout(timer);
    };
  }, [checkScroll, roles]);

  // Listen to wheel events on the entire role section wrapper to translate vertical wheel to horizontal scroll
  useEffect(() => {
    const wrapper = roleWrapperRef.current;
    const el = roleScrollRef.current;
    if (!wrapper || !el) return;

    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          el.scrollBy({ left: e.deltaY * 1.1, behavior: 'auto' });
          checkScroll();
        }
      }
    };

    wrapper.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      wrapper.removeEventListener('wheel', onWheel);
    };
  }, [checkScroll]);

  // Window-level Drag-to-scroll support for mouse users on desktop/laptop
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = roleScrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    scrollLeftRef.current = el.scrollLeft;

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !roleScrollRef.current) return;
      const walk = moveEvent.clientX - startXRef.current;
      if (Math.abs(walk) > 4) {
        hasMovedRef.current = true;
      }
      roleScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
      checkScroll();
    };

    const handleWindowMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 60);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  const scrollHorizontally = (amount: number) => {
    if (roleScrollRef.current) {
      roleScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  const selectRoleAndScroll = (roleId: string) => {
    if (hasMovedRef.current) return;
    setSelectedRole(roleId);
    const itemEl = roleItemRefs.current[roleId];
    if (itemEl) {
      itemEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      setTimeout(checkScroll, 350);
    }
  };

  const formatRoleName = (name: string) => {
    if (!name) return '';
    if (name === 'SUPER_ADMIN') return 'Super Administrator';
    if (name === 'DISTRICT_LEADER') return 'District Leader';
    if (name === 'UNION_LEADER') return 'Union Leader';
    if (name === 'KILAI_LEADER') return 'Kilai Leader';
    if (name === 'CADRE') return 'Cadre Member';
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Roles tiered from Tier 1 (Super Admin) to Tier 5 (Cadre)
  const getRoleTier = (name: string) => {
    if (name === 'SUPER_ADMIN') return 'Tier 1 • Full Access';
    if (name === 'DISTRICT_LEADER' || name.includes('DISTRICT')) return 'Tier 2 • District Level';
    if (name === 'UNION_LEADER' || name.includes('UNION')) return 'Tier 3 • Union Level';
    if (name === 'KILAI_LEADER' || name.includes('KILAI')) return 'Tier 4 • Kilai Level';
    if (name === 'CADRE' || name.includes('CADRE')) return 'Tier 5 • Cadre Level';
    return 'Standard Access';
  };

  const getActionBadge = (action: string) => {
    const act = (action.split(':').pop() || action).toLowerCase();
    if (act.includes('delete') || act.includes('remove')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          Delete
        </span>
      );
    }
    if (act.includes('write') || act.includes('create')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Write
        </span>
      );
    }
    if (act.includes('update') || act.includes('edit')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Update
        </span>
      );
    }
    if (act.includes('import') || act.includes('export')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          Data
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
        Read
      </span>
    );
  };

  // Module icons matching the side menu list
  const getModuleIcon = (moduleName: string) => {
    const mod = moduleName.toLowerCase().trim();
    if (mod.includes('home') || mod.includes('dash')) return <Home className="w-5 h-5 text-[#8F0A1B] dark:text-[#FFC72C]" />;
    if (mod.includes('union')) return <Building2 className="w-5 h-5 text-[#8F0A1B] dark:text-[#FFC72C]" />;
    if (mod.includes('kilai')) return <GitBranch className="w-5 h-5 text-amber-600 dark:text-[#FFC72C]" />;
    if (mod.includes('cadre')) return <Users className="w-5 h-5 text-[#8F0A1B] dark:text-[#FFC72C]" />;
    if (mod.includes('wing')) return <Bird className="w-5 h-5 text-[#8F0A1B] dark:text-[#FFC72C]" />;
    if (mod.includes('booth')) return <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    if (mod.includes('announc')) return <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    if (mod.includes('analytic')) return <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    if (mod.includes('report')) return <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
    if (mod.includes('setting')) return <Settings2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    return <ShieldCheck className="w-5 h-5 text-[#8F0A1B] dark:text-[#FFC72C]" />;
  };

  // Filter out District & Users and sort by sidebar menu order
  const sortedModuleEntries = useMemo(() => {
    return Object.entries(groupedPermissions)
      .filter(([moduleName]) => {
        const key = moduleName.toLowerCase().trim();
        return key !== 'district' && key !== 'districts' && key !== 'user' && key !== 'users';
      })
      .sort(([nameA], [nameB]) => {
        const rankA = SIDEBAR_MODULE_ORDER[nameA.toLowerCase().trim()] ?? 99;
        const rankB = SIDEBAR_MODULE_ORDER[nameB.toLowerCase().trim()] ?? 99;
        return rankA - rankB;
      });
  }, [groupedPermissions]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-md overflow-hidden bg-card">
        {/* Responsive Card Header */}
        {/* Responsive Card Header */}
        <CardHeader className="bg-gradient-to-r from-[#8F0A1B]/5 via-zinc-50 to-[#FFC72C]/5 dark:from-[#8F0A1B]/10 dark:via-zinc-900 dark:to-transparent border-b border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3.5 items-center">
              <div className="p-3 bg-[#8F0A1B] text-white rounded-xl shadow-xs shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#FFC72C]" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  System Roles & Permissions
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1 text-zinc-600 dark:text-zinc-400">
                  Configure granular action privileges and security boundaries for each organizational role
                </CardDescription>
              </div>
            </div>

            {hasWritePermission && (
              <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
                {hasUnsavedChanges && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                    Unsaved Changes
                  </span>
                )}
                <Button 
                  onClick={handleSave} 
                  disabled={isUpdating || !selectedRole} 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#8F0A1B] hover:bg-[#8F0A1B]/90 text-white font-bold rounded-xl h-11 px-6 shadow-sm text-sm sm:text-base cursor-pointer"
                >
                  <Save className="w-4.5 h-4.5" />
                  {isUpdating ? 'Saving Permissions...' : 'Save Permissions'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-base font-semibold">Loading roles and permissions matrix...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ROLE SELECTOR: Horizontal scrollable for mobile, md, and lg screens */}
              <div ref={roleWrapperRef} className="block xl:hidden space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs sm:text-sm font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary" /> Select Active Role
                  </span>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs sm:text-sm font-bold text-primary font-mono">{roles.length} roles</span>
                  </div>
                </div>

                <div 
                  ref={roleScrollRef}
                  onMouseDown={handleMouseDown}
                  className="roles-scrollbar flex gap-2.5 overflow-x-auto pb-2.5 px-0.5 scroll-smooth cursor-grab active:cursor-grabbing select-none"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {roles.map((role: any) => {
                    const isSelected = selectedRole === role.id;
                    const isSuper = role.name === 'SUPER_ADMIN';
                    const count = isSuper ? permissions.length : (role.permissions?.length || 0);

                    return (
                      <button
                        key={role.id}
                        ref={(el) => { roleItemRefs.current[role.id] = el; }}
                        type="button"
                        onClick={() => selectRoleAndScroll(role.id)}
                        className={cn(
                          "shrink-0 flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-2xs cursor-pointer",
                          isSelected 
                            ? "bg-gradient-to-r from-[#8F0A1B] to-[#A81327] text-white border-[#8F0A1B] shadow-md shadow-[#8F0A1B]/20"
                            : "bg-zinc-50 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        <Shield className={cn("w-4 h-4", isSelected ? "text-[#FFC72C]" : "text-zinc-400")} />
                        <span className="whitespace-nowrap">{formatRoleName(role.name)}</span>
                        <span className={cn(
                          "text-xs font-mono px-2 py-0.5 rounded-full font-bold",
                          isSelected ? "bg-white/20 text-white" : "bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                  {/* Trailing spacer so the last chip has comfortable right spacing */}
                  <div className="w-4 shrink-0" aria-hidden="true" />
                </div>
              </div>

              {/* DESKTOP 4-COLUMN GRID (Sidebar + Permissions Matrix on xl screens) */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                {/* DESKTOP ROLES SIDEBAR (Sorted by Tier): only on xl screens */}
                <div className="hidden xl:block col-span-1 space-y-2.5 sticky top-4">
                  <div className="flex items-center justify-between pb-1 px-1">
                    <h3 className="font-black text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-primary" />
                      System Roles
                    </h3>
                    <span className="text-xs sm:text-sm font-bold text-zinc-500 dark:text-zinc-400 font-mono">{roles.length} total</span>
                  </div>
                  
                  <div className="space-y-2">
                    {roles.map((role: any) => {
                      const isSelected = selectedRole === role.id;
                      const isSuper = role.name === 'SUPER_ADMIN';
                      const count = isSuper ? permissions.length : (role.permissions?.length || 0);

                      return (
                        <div 
                          key={role.id} 
                          onClick={() => setSelectedRole(role.id)}
                          className={cn(
                            "group relative p-3.5 rounded-xl cursor-pointer transition-all border text-left",
                            isSelected 
                              ? "bg-gradient-to-r from-[#8F0A1B] to-[#A81327] text-white border-[#8F0A1B] shadow-md shadow-[#8F0A1B]/15 translate-x-1"
                              : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-primary/40 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                isSelected ? "bg-white/20 text-[#FFC72C]" : "bg-primary/10 text-primary group-hover:bg-primary/15"
                              )}>
                                <Shield className="w-4.5 h-4.5" />
                              </div>
                              <div className="min-w-0">
                                <p className={cn(
                                  "font-black text-base truncate",
                                  isSelected ? "text-white" : "text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors"
                                )}>
                                  {formatRoleName(role.name)}
                                </p>
                                <p className={cn(
                                  "text-xs sm:text-[13px] font-semibold truncate mt-0.5",
                                  isSelected ? "text-white/85" : "text-zinc-500 dark:text-zinc-400"
                                )}>
                                  {getRoleTier(role.name)}
                                </p>
                              </div>
                            </div>

                            <span className={cn(
                              "text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0",
                              isSelected ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            )}>
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PERMISSIONS MATRIX */}
                <div className="col-span-1 xl:col-span-3 space-y-6">
                  {/* Active Role Control Bar */}
                  <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-red-50/70 via-amber-50/30 to-white dark:from-[#8F0A1B]/15 dark:via-zinc-900 dark:to-zinc-950 border border-[#8F0A1B]/15 dark:border-zinc-800 shadow-xs">
                    {/* Top TVK accent stripe on mobile */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8F0A1B] via-[#D97706] to-[#FFC72C] sm:hidden" />

                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#8F0A1B] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFC72C]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-black text-base sm:text-lg text-zinc-900 dark:text-zinc-100 truncate">
                            {formatRoleName(activeRoleObj?.name || 'Role')}
                          </h3>
                          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#8F0A1B]/10 text-[#8F0A1B] dark:text-red-400 border border-[#8F0A1B]/20 shrink-0">
                            {localPermissions.length} / {permissions.length} Active
                          </span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                          {activeRoleObj?.description || 'Assign permitted actions for this role across system modules'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-zinc-200/80 dark:border-zinc-800">
                      <button 
                        type="button"
                        onClick={() => !isSystemSuperAdmin && handleGlobalSelectAll(!isGlobalAllSelected)}
                        disabled={isSystemSuperAdmin || permissions.length === 0}
                        className={cn(
                          "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all select-none cursor-pointer w-full sm:w-auto shadow-2xs active:scale-95",
                          isGlobalAllSelected 
                            ? "bg-gradient-to-r from-[#8F0A1B] to-[#A81327] text-white border-[#8F0A1B] shadow-xs" 
                            : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750",
                          isSystemSuperAdmin ? "opacity-60 cursor-not-allowed" : ""
                        )}
                      >
                        <Checkbox 
                          id="global-select-all" 
                          checked={isSystemSuperAdmin ? true : isGlobalAllSelected}
                          onCheckedChange={(checked) => handleGlobalSelectAll(!!checked)}
                          disabled={isSystemSuperAdmin || permissions.length === 0}
                          className={cn(
                            "pointer-events-none rounded",
                            isGlobalAllSelected ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-[#8F0A1B]" : ""
                          )}
                        />
                        <span className="font-extrabold whitespace-nowrap">Select All Permissions</span>
                      </button>
                    </div>
                  </div>

                  {/* Super Admin Notice */}
                  {isSystemSuperAdmin && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3.5 text-sm text-amber-800 dark:text-amber-300 font-medium">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>
                        <strong>Super Administrator</strong> is the core root tier with permanent full privileges across all current and future modules.
                      </span>
                    </div>
                  )}

                  {/* Grouped Modules (Ordered by Side Menu List) */}
                  <div className="space-y-6">
                    {sortedModuleEntries.map(([moduleName, perms]) => {
                      const modulePermIds = perms.map((p: any) => p.id);
                      const activeInModuleCount = modulePermIds.filter((id: string) => localPermissions.includes(id)).length;
                      const isModuleAllSelected = activeInModuleCount === modulePermIds.length && modulePermIds.length > 0;

                      return (
                        <div key={moduleName} className="border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden bg-card shadow-xs">
                          {/* Module Header */}
                          <div className="relative overflow-hidden bg-gradient-to-r from-red-50/90 via-amber-50/40 to-white dark:from-[#8F0A1B]/20 dark:via-zinc-900/95 dark:to-zinc-950 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#8F0A1B]/15 dark:border-zinc-800">
                            {/* Left TVK Brand Accent Bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-gradient-to-b from-[#8F0A1B] via-[#D97706] to-[#FFC72C]" />

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pl-1 sm:pl-1.5">
                              {/* Top Row on Mobile / Left on Desktop: Icon + Name + Active Count */}
                              <div className="flex items-center justify-between gap-3 min-w-0 flex-1">
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Icon Badge */}
                                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-zinc-800 text-[#8F0A1B] dark:text-[#FFC72C] flex items-center justify-center shrink-0 shadow-2xs border border-[#8F0A1B]/15 dark:border-zinc-700/80">
                                    {getModuleIcon(moduleName)}
                                  </div>

                                  {/* Module Name - NEVER HIDDEN, NO TRUNCATE */}
                                  <h4 className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide text-sm sm:text-base leading-tight">
                                    {moduleName} Module
                                  </h4>
                                </div>

                                {/* Active Count Badge */}
                                <span className={cn(
                                  "inline-flex items-center text-xs sm:text-sm font-mono font-bold px-3 py-1 rounded-full border shrink-0",
                                  activeInModuleCount > 0
                                    ? "bg-[#8F0A1B]/10 dark:bg-[#8F0A1B]/25 text-[#8F0A1B] dark:text-red-400 border-[#8F0A1B]/20"
                                    : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300/60 dark:border-zinc-700"
                                )}>
                                  {activeInModuleCount} / {perms.length} <span className="ml-1 font-sans font-semibold">Active</span>
                                </span>
                              </div>

                              {/* Bottom Action on Mobile / Right Action on Desktop: Select All Toggle */}
                              <div className="flex items-center justify-between sm:justify-end gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#8F0A1B]/10 dark:border-zinc-800/80">
                                <span className="text-xs sm:text-sm font-bold text-muted-foreground flex items-center gap-1.5 sm:hidden">
                                  <ShieldCheck className="w-4 h-4 text-[#8F0A1B] dark:text-[#FFC72C]" />
                                  Module Permissions
                                </span>

                                <button
                                  type="button"
                                  onClick={() => !isSystemSuperAdmin && handleModuleSelectAll(moduleName, !isModuleAllSelected)}
                                  disabled={isSystemSuperAdmin}
                                  className={cn(
                                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black select-none cursor-pointer transition-all border shrink-0 shadow-2xs active:scale-95 ml-auto sm:ml-0",
                                    isModuleAllSelected 
                                      ? "bg-gradient-to-r from-[#8F0A1B] to-[#A81327] text-white border-[#8F0A1B] shadow-xs shadow-[#8F0A1B]/20" 
                                      : "bg-white dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                                    isSystemSuperAdmin ? "opacity-60 cursor-not-allowed" : ""
                                  )}
                                  aria-label={`Select all permissions for ${moduleName} module`}
                                >
                                  <Checkbox 
                                    id={`mod-select-all-${moduleName}`}
                                    checked={isSystemSuperAdmin ? true : isModuleAllSelected}
                                    onCheckedChange={(checked) => handleModuleSelectAll(moduleName, !!checked)}
                                    disabled={isSystemSuperAdmin}
                                    className={cn(
                                      "pointer-events-none rounded",
                                      isModuleAllSelected ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-[#8F0A1B]" : ""
                                    )}
                                  />
                                  <span className="whitespace-nowrap font-black">Select All</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Permission Cards Grid */}
                          <div className="p-3.5 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {perms.map((perm: any) => {
                              const isChecked = localPermissions.includes(perm.id);
                              const actionName = (perm.action.split(':').pop() || perm.action).replace(/-/g, ' ');
                              const displayAction = actionName.charAt(0).toUpperCase() + actionName.slice(1);

                              return (
                                <div 
                                  key={perm.id} 
                                  onClick={() => {
                                    if (!isSystemSuperAdmin) {
                                      handleToggle(perm.id, !isChecked);
                                    }
                                  }}
                                  className={cn(
                                    "flex items-start gap-3.5 p-3.5 rounded-xl transition-all border select-none cursor-pointer group",
                                    (isSystemSuperAdmin || isChecked)
                                      ? "bg-primary/5 dark:bg-primary/10 border-primary/30 shadow-2xs" 
                                      : "bg-white dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                                    isSystemSuperAdmin ? "cursor-default" : ""
                                  )}
                                >
                                  <Checkbox 
                                    id={`perm-${perm.id}`}
                                    checked={isSystemSuperAdmin ? true : isChecked} 
                                    disabled={isSystemSuperAdmin}
                                    onCheckedChange={(checked) => handleToggle(perm.id, !!checked)}
                                    className="mt-1 shrink-0 pointer-events-none"
                                  />
                                  <div className="space-y-1.5 min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-sm sm:text-base font-bold leading-tight truncate text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">
                                        {displayAction}
                                      </span>
                                      {getActionBadge(perm.action)}
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                      {perm.description || `Allow ${displayAction.toLowerCase()} operations on ${moduleName.toLowerCase()}`}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {permissions.length === 0 && (
                    <div className="text-center p-12 border border-dashed rounded-2xl text-muted-foreground bg-muted/20">
                      <ShieldCheck className="w-10 h-10 mx-auto opacity-30 mb-2" />
                      <p className="font-semibold text-base">No permissions defined in the system database.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MOBILE FLOATING SAVE ACTION BAR (When Unsaved Changes Exist) */}
      {hasWritePermission && hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden z-40 bg-gradient-to-r from-[#8F0A1B] via-[#A81327] to-[#7B0715] text-white p-4 rounded-2xl shadow-2xl border border-[#FFC72C]/30 backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFC72C] animate-ping" />
            <span className="text-sm font-black text-white">Unsaved Changes</span>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isUpdating} 
            size="sm" 
            className="bg-[#FFC72C] hover:bg-[#FFC72C]/90 text-[#8F0A1B] rounded-xl font-black h-10 px-4 text-sm shadow-md cursor-pointer"
          >
            {isUpdating ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      )}
    </div>
  );
}
