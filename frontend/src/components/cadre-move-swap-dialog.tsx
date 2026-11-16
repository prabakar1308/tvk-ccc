'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { UserAvatar } from "@/components/ui/user-avatar";
import { 
  ArrowLeftRight, 
  ArrowRight, 
  Check, 
  ChevronsUpDown, 
  Search, 
  AlertCircle, 
  MapPin, 
  Shield, 
  Award, 
  Sparkles, 
  X,
  Shuffle,
  Building2,
  RefreshCw,
  UserCheck,
  Phone,
  CreditCard,
  Loader2
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { cadreApi } from '@/services/api/cadres';
import { useCadres, useMoveCadre, useSwapCadres } from '@/hooks/use-cadres';
import { useDistricts } from '@/hooks/use-districts';
import { useUnions } from '@/hooks/use-unions';
import { useKilais } from '@/hooks/use-kilais';
import { useWings } from '@/hooks/use-wings';
import { useLocale } from 'next-intl';
import { translatePersonNameToTamil } from '@/lib/name-translations';
import { formatDesignation } from '@/components/cadre-card';
import { cn } from '@/lib/utils';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export interface CadreMoveSwapDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialCadre?: any;
  initialMode?: 'swap' | 'move';
  contextScope?: {
    level?: 'DISTRICT' | 'UNION' | 'KILAI';
    districtId?: string;
    unionId?: string;
    kilaiId?: string;
    wingId?: string;
  };
  onSuccess?: (result: any) => void;
}

export function CadreMoveSwapDialog({
  isOpen,
  onOpenChange,
  initialCadre,
  initialMode = 'swap',
  contextScope,
  onSuccess,
}: CadreMoveSwapDialogProps) {
  const locale = useLocale();

  // Queries
  const { data: allCadres = [], isLoading: isLoadingCadres } = useCadres({ isWing: 'all' });
  const { data: districts = [] } = useDistricts();
  const { data: unions = [] } = useUnions();
  const { data: kilais = [] } = useKilais();
  const { data: wings = [] } = useWings();

  // Mutations
  const moveMutation = useMoveCadre();
  const swapMutation = useSwapCadres();

  // Dialog State
  const [activeTab, setActiveTab] = useState<'swap' | 'move'>(initialMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cadre selection
  const [cadreA, setCadreA] = useState<any>(null);
  const [cadreB, setCadreB] = useState<any>(null);

  // Search popovers and inputs
  const [isCadreAPickerOpen, setIsCadreAPickerOpen] = useState(false);
  const [isCadreBPickerOpen, setIsCadreBPickerOpen] = useState(false);
  const [cadreASearch, setCadreASearch] = useState('');
  const [cadreBSearch, setCadreBSearch] = useState('');
  const [cadreAFilter, setCadreAFilter] = useState<'ALL' | 'GENERAL' | 'WINGS'>('ALL');
  const [cadreBFilter, setCadreBFilter] = useState<'ALL' | 'SAME_UNIT' | 'CROSS_LEVEL' | 'WINGS'>('ALL');

  // Debounced search queries (triggers API search after 3 characters)
  const debouncedSearchA = useDebounce(cadreASearch, 300);
  const debouncedSearchB = useDebounce(cadreBSearch, 300);

  const isSearchActiveA = debouncedSearchA.trim().length >= 3;
  const { data: searchResultsA = [], isFetching: isSearchingA } = useQuery({
    queryKey: ['cadres-search', debouncedSearchA.trim(), locale],
    queryFn: () => cadreApi.getAll({ search: debouncedSearchA.trim(), isWing: 'all', limit: '50' }, locale),
    enabled: isSearchActiveA && isCadreAPickerOpen,
    staleTime: 30000,
  });

  const isSearchActiveB = debouncedSearchB.trim().length >= 3;
  const { data: searchResultsB = [], isFetching: isSearchingB } = useQuery({
    queryKey: ['cadres-search', debouncedSearchB.trim(), locale],
    queryFn: () => cadreApi.getAll({ search: debouncedSearchB.trim(), isWing: 'all', limit: '50' }, locale),
    enabled: isSearchActiveB && isCadreBPickerOpen,
    staleTime: 30000,
  });

  // Move Form State
  const [moveLevel, setMoveLevel] = useState<'DISTRICT' | 'UNION' | 'KILAI'>('KILAI');
  const [moveDistrictId, setMoveDistrictId] = useState<string>('');
  const [moveUnionId, setMoveUnionId] = useState<string>('');
  const [moveKilaiId, setMoveKilaiId] = useState<string>('');
  const [moveWingId, setMoveWingId] = useState<string>('NONE');
  const [moveRole, setMoveRole] = useState<string>('');
  const [customRole, setCustomRole] = useState<string>('');
  const [movePanchayat, setMovePanchayat] = useState<string>('');
  const [moveVillage, setMoveVillage] = useState<string>('');
  const [moveBoothNo, setMoveBoothNo] = useState<string>('');

  // Swap Advanced Options
  const [swapAssignments, setSwapAssignments] = useState(true);
  const [customRoleA, setCustomRoleA] = useState('');
  const [customRoleB, setCustomRoleB] = useState('');
  const [showCustomSwapRoles, setShowCustomSwapRoles] = useState(false);

  // Reset/Initialize state when dialog opens or initialCadre changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setActiveTab(initialMode);
      
      const primary = initialCadre || null;
      setCadreA(primary);
      setCadreB(null);

      if (primary) {
        setMoveLevel(primary.level || 'KILAI');
        setMoveDistrictId(primary.districtId || (districts[0]?.id ? String(districts[0].id) : ''));
        setMoveUnionId(primary.unionId || '');
        setMoveKilaiId(primary.homeKilaiId || '');
        setMoveWingId(primary.wingId || 'NONE');
        setMoveRole(primary.role || 'Member');
        setMovePanchayat(primary.panchayat || '');
        setMoveVillage(primary.village || '');
        setMoveBoothNo(primary.boothNo || '');
      } else if (districts.length > 0) {
        setMoveDistrictId(String(districts[0].id));
      }
    }
  }, [isOpen, initialCadre, initialMode, districts]);

  // When cadreA changes in Move mode, sync defaults
  const handleSelectCadreA = (cadre: any) => {
    setCadreA(cadre);
    setIsCadreAPickerOpen(false);
    setCadreASearch('');
    setErrorMessage(null);

    if (cadre) {
      setMoveLevel(cadre.level || 'KILAI');
      setMoveDistrictId(cadre.districtId || (districts[0]?.id ? String(districts[0].id) : ''));
      setMoveUnionId(cadre.unionId || '');
      setMoveKilaiId(cadre.homeKilaiId || '');
      setMoveWingId(cadre.wingId || 'NONE');
      setMoveRole(cadre.role || 'Member');
      setMovePanchayat(cadre.panchayat || '');
      setMoveVillage(cadre.village || '');
      setMoveBoothNo(cadre.boothNo || '');
    }
  };

  const handleSelectCadreB = (cadre: any) => {
    setCadreB(cadre);
    setIsCadreBPickerOpen(false);
    setCadreBSearch('');
    setErrorMessage(null);
  };

  const handleFlipCadres = () => {
    if (!cadreA && !cadreB) return;
    const temp = cadreA;
    setCadreA(cadreB);
    setCadreB(temp);
  };

  // Filter unions for selected district
  const availableUnions = useMemo(() => {
    if (!moveDistrictId) return unions;
    return unions.filter((u: any) => String(u.districtId || '') === String(moveDistrictId));
  }, [unions, moveDistrictId]);

  // Filter kilais for selected union
  const availableKilais = useMemo(() => {
    if (!moveUnionId) return kilais;
    return kilais.filter((k: any) => String(k.unionId || '') === String(moveUnionId));
  }, [kilais, moveUnionId]);

  // Filtered Cadres for Cadre A selection (initial / suggested)
  const filteredCadresForA = useMemo(() => {
    return allCadres.filter((c: any) => {
      if (cadreAFilter === 'GENERAL') {
        return !c.wingId && !c.wing;
      }
      if (cadreAFilter === 'WINGS') {
        return Boolean(c.wingId || c.wing);
      }
      return true;
    });
  }, [allCadres, cadreAFilter]);

  // Filtered Cadres for Cadre B selection (initial / suggested)
  const filteredCadresForB = useMemo(() => {
    return allCadres.filter((c: any) => {
      // Exclude Cadre A
      if (cadreA && c.id === cadreA.id) return false;

      // Filter by category
      if (cadreBFilter === 'SAME_UNIT' && cadreA) {
        if (cadreA.level === 'KILAI') {
          return c.level === 'KILAI' && (c.homeKilaiId === cadreA.homeKilaiId || c.unionId === cadreA.unionId);
        }
        if (cadreA.level === 'UNION') {
          return c.level === 'UNION' && c.unionId === cadreA.unionId;
        }
        if (cadreA.level === 'DISTRICT') {
          return c.level === 'DISTRICT';
        }
      }

      if (cadreBFilter === 'CROSS_LEVEL' && cadreA) {
        return c.level !== cadreA.level;
      }

      if (cadreBFilter === 'WINGS') {
        return Boolean(c.wingId || c.wing);
      }

      return true;
    });
  }, [allCadres, cadreA, cadreBFilter]);

  // Filtered API search results for Cadre B
  const filteredSearchResultsB = useMemo(() => {
    return searchResultsB.filter((c: any) => {
      // Exclude Cadre A
      if (cadreA && c.id === cadreA.id) return false;

      // Filter by category
      if (cadreBFilter === 'SAME_UNIT' && cadreA) {
        if (cadreA.level === 'KILAI') {
          return c.level === 'KILAI' && (c.homeKilaiId === cadreA.homeKilaiId || c.unionId === cadreA.unionId);
        }
        if (cadreA.level === 'UNION') {
          return c.level === 'UNION' && c.unionId === cadreA.unionId;
        }
        if (cadreA.level === 'DISTRICT') {
          return c.level === 'DISTRICT';
        }
      }

      if (cadreBFilter === 'CROSS_LEVEL' && cadreA) {
        return c.level !== cadreA.level;
      }

      if (cadreBFilter === 'WINGS') {
        return Boolean(c.wingId || c.wing);
      }

      return true;
    });
  }, [searchResultsB, cadreA, cadreBFilter]);

  // Preset role options based on destination level and wing
  const presetRoles = useMemo(() => {
    if (moveWingId && moveWingId !== 'NONE') {
      return ['Coordinator', 'Co-coordinator', 'Member'];
    }
    return [
      'Secretary',
      'Joint Secretary',
      'Treasurer',
      'Deputy Secretary',
      'EC Member',
      'President',
      'Member',
    ];
  }, [moveWingId]);

  // Execute Swap
  const handleExecuteSwap = async () => {
    if (!cadreA || !cadreB) {
      setErrorMessage('Please select both cadres to perform the swap.');
      return;
    }
    if (cadreA.id === cadreB.id) {
      setErrorMessage('Cannot swap a cadre with themselves.');
      return;
    }

    setErrorMessage(null);
    try {
      const res = await swapMutation.mutateAsync({
        cadreAId: cadreA.id,
        cadreBId: cadreB.id,
        roleA: showCustomSwapRoles && customRoleA.trim() ? customRoleA.trim() : undefined,
        roleB: showCustomSwapRoles && customRoleB.trim() ? customRoleB.trim() : undefined,
        swapAssignments,
      });

      setSuccessMessage('Roles and assignments swapped successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onOpenChange(false);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to swap cadres. Please check limits and try again.');
    }
  };

  // Execute Move
  const handleExecuteMove = async () => {
    if (!cadreA) {
      setErrorMessage('Please select a cadre to move.');
      return;
    }

    const finalRole = moveRole === '__CUSTOM__' ? customRole.trim() : moveRole;
    if (!finalRole) {
      setErrorMessage('Please specify the destination role.');
      return;
    }

    if (moveLevel === 'UNION' && !moveUnionId) {
      setErrorMessage('Please select a destination Union.');
      return;
    }

    if (moveLevel === 'KILAI' && (!moveUnionId || !moveKilaiId)) {
      setErrorMessage('Please select both a destination Union and Kilai.');
      return;
    }

    setErrorMessage(null);
    try {
      const res = await moveMutation.mutateAsync({
        id: cadreA.id,
        data: {
          role: finalRole,
          level: moveLevel,
          districtId: moveDistrictId || undefined,
          unionId: moveLevel !== 'DISTRICT' ? (moveUnionId || null) : null,
          homeKilaiId: moveLevel === 'KILAI' ? (moveKilaiId || null) : null,
          wingId: moveWingId !== 'NONE' ? moveWingId : null,
          panchayat: movePanchayat.trim() || null,
          village: moveVillage.trim() || null,
          boothNo: moveBoothNo.trim() || null,
        },
      });

      setSuccessMessage('Cadre reassigned successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onOpenChange(false);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to move cadre. Please verify inputs.');
    }
  };

  // Helper to format complete org unit breadcrumb (Kilai, Union, District, Wing)
  const formatOrgUnitDetails = (cadre: any) => {
    if (!cadre) return '';
    const parts: string[] = [];

    const wingName = cadre.wing?.name || wings.find((w: any) => String(w.id) === String(cadre.wingId))?.name;
    const kilaiName = cadre.homeKilai?.name || kilais.find((k: any) => String(k.id || k._id) === String(cadre.homeKilaiId))?.name;
    const unionName = cadre.union?.name || unions.find((u: any) => String(u.id || u._id) === String(cadre.unionId))?.name;
    const districtName = cadre.district?.name || districts.find((d: any) => String(d.id || d._id) === String(cadre.districtId))?.name;

    if (wingName) {
      parts.push(`${wingName} (${cadre.level || 'Wing'})`);
    } else if (kilaiName) {
      parts.push(`${kilaiName} (Kilai)`);
    }

    if (unionName) {
      parts.push(`${unionName} (Union)`);
    }

    if (districtName) {
      parts.push(`${districtName} (District)`);
    }

    if (parts.length === 0 && cadre.level) {
      parts.push(`Level: ${cadre.level}`);
    }

    return parts.join(' • ');
  };

  // Helper renderer for each search result item in CommandList
  const renderCadreSearchItem = (c: any, onSelect: () => void) => {
    const displayName = c.name
      ? (locale === 'ta' ? translatePersonNameToTamil(c.name) : c.name)
      : 'Unnamed';
    const roleText = formatDesignation(c.role, locale);
    const orgUnitText = formatOrgUnitDetails(c);
    const voterIdOrMemberId = c.voterId || c.memberId || '-';
    const isWingCadre = Boolean(c.wingId || c.wing);

    return (
      <CommandItem
        key={c.id}
        value={`${c.id}-${c.name}-${c.phone || ''}-${c.voterId || ''}-${c.wing?.name || ''}`}
        onSelect={onSelect}
        className="flex items-start gap-3 p-3 cursor-pointer rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors border-b border-zinc-100 dark:border-zinc-800/60 last:border-b-0"
      >
        <UserAvatar
          src={c.photoUrl}
          name={displayName}
          size="md"
          className="shrink-0 mt-0.5 ring-1 ring-zinc-200 dark:ring-zinc-700 shadow-2xs"
          ring={isWingCadre ? "gold" : "default"}
        />

        <div className="min-w-0 flex-1 space-y-1">
          {/* Row 1: Name and Role Designation */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-heading font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {displayName}
              </span>
              {isWingCadre && (
                <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                  {c.wing?.name || 'Wing'}
                </span>
              )}
            </div>
            <span className={cn(
              "inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0",
              isWingCadre
                ? "bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/50"
            )}>
              {roleText}
            </span>
          </div>

          {/* Row 2: Phone No and Voter ID */}
          <div className="flex items-center gap-2.5 text-[11px] text-zinc-600 dark:text-zinc-400 flex-wrap">
            {c.phone ? (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                <Phone className="w-3 h-3 text-primary shrink-0" />
                {c.phone}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground italic">
                <Phone className="w-3 h-3 opacity-40 shrink-0" />
                -
              </span>
            )}

            <span className="inline-flex items-center gap-1 font-mono text-[10.5px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
              <CreditCard className="w-3 h-3 text-primary/70 shrink-0" />
              <span className="text-[10px] text-muted-foreground">Voter ID:</span>
              <span className="font-semibold">{voterIdOrMemberId}</span>
            </span>
          </div>

          {/* Row 3: Org Unit details (Kilai, Union, District, Wing) */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
            <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
            <span className="truncate font-medium">
              {orgUnitText}
            </span>
          </div>
        </div>
      </CommandItem>
    );
  };

  // Helper renderer for cadre badge card (when selected)
  const renderCadreCard = (cadre: any, onClear?: () => void, isTarget: boolean = false) => {
    if (!cadre) return null;

    const displayName = cadre.name
      ? (locale === 'ta' ? translatePersonNameToTamil(cadre.name) : cadre.name)
      : 'Unnamed';
    const roleText = formatDesignation(cadre.role, locale);
    const orgUnitText = formatOrgUnitDetails(cadre);
    const voterIdOrMemberId = cadre.voterId || cadre.memberId || '-';
    const isWingCadre = Boolean(cadre.wingId || cadre.wing);

    return (
      <div className={cn(
        "relative p-4 rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between gap-3 w-full",
        isTarget
          ? "bg-gradient-to-b from-amber-500/[0.04] to-amber-500/[0.09] dark:from-amber-950/20 dark:to-zinc-900 border-amber-400/40 dark:border-amber-600/30 ring-1 ring-amber-400/20"
          : "bg-gradient-to-b from-primary/[0.04] to-primary/[0.09] dark:from-primary/10 dark:to-zinc-900 border-primary/25 dark:border-primary/40 ring-1 ring-primary/10"
      )}>
        {/* Top Header Row: Avatar, Name, Role Badge, Change Action */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              src={cadre.photoUrl}
              name={displayName}
              size="lg"
              className="shrink-0 ring-2 ring-white dark:ring-zinc-800 shadow-xs"
              ring={isTarget ? "gold" : "primary"}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-heading font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                  {displayName}
                </h4>
                {isWingCadre && (
                  <span className="inline-flex items-center text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Shield className="w-3 h-3 mr-0.5" />
                    {cadre.wing?.name || 'Wing'}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className={cn(
                  "inline-flex items-center text-[10.5px] font-bold px-2.5 py-0.5 rounded-md border",
                  isTarget
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                    : "bg-primary/10 text-primary dark:text-primary-foreground border-primary/20"
                )}>
                  {roleText}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {cadre.level || 'Party'}
                </span>
              </div>
            </div>
          </div>

          {onClear && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              className="h-7 px-2.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/30 rounded-lg shrink-0 gap-1.5 shadow-2xs transition-colors"
              title="Change administrator"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{locale === 'ta' ? 'மாற்று' : 'Change'}</span>
            </Button>
          )}
        </div>

        {/* Contact & Voter ID Meta Tiles Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60 shadow-2xs">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Phone className="w-3 h-3" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Phone</p>
              <p className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                {cadre.phone || <span className="text-muted-foreground italic font-sans font-normal text-[11px]">Not provided</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60 shadow-2xs">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <CreditCard className="w-3 h-3" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Voter ID</p>
              <p className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                {voterIdOrMemberId}
              </p>
            </div>
          </div>
        </div>

        {/* Org Unit Location Bottom Strip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50 text-[11px] text-zinc-700 dark:text-zinc-300">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-medium truncate">
            {orgUnitText}
          </span>
        </div>
      </div>
    );
  };

  // Reusable Cadre A Popover Picker (with API search after 3 chars)
  const renderCadreAPopover = (placeholderText: string = 'Select Cadre A (Type min 3 chars to search)...') => (
    <Popover open={isCadreAPickerOpen} onOpenChange={setIsCadreAPickerOpen}>
      <PopoverTrigger className="flex items-center justify-between w-full h-14 px-3.5 py-2 text-xs rounded-2xl border-2 border-dashed hover:border-primary/50 bg-white dark:bg-zinc-900 shadow-xs cursor-pointer transition-colors text-left">
        <span className="text-muted-foreground flex items-center gap-2 truncate">
          <Search className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{placeholderText}</span>
        </span>
        <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[92vw] sm:w-[480px] p-0 shadow-xl rounded-2xl overflow-hidden" align="start">
        <Command shouldFilter={false} className="rounded-2xl">
          <div className="p-2 border-b bg-zinc-50 dark:bg-zinc-800/60 flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCadreAFilter('ALL')}
              className={cn(
                "text-[10.5px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                cadreAFilter === 'ALL' ? "bg-primary text-white shadow-xs" : "bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setCadreAFilter('GENERAL')}
              className={cn(
                "text-[10.5px] font-bold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer",
                cadreAFilter === 'GENERAL' ? "bg-primary text-white shadow-xs" : "bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              )}
            >
              General Admin
            </button>
            <button
              type="button"
              onClick={() => setCadreAFilter('WINGS')}
              className={cn(
                "text-[10.5px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1",
                cadreAFilter === 'WINGS' ? "bg-primary text-white shadow-xs" : "bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              )}
            >
              <Shield className="w-3 h-3" /> Wings
            </button>
          </div>

          <CommandInput
            placeholder="Type min 3 characters (Name, Voter ID, Phone, Kilai)..."
            value={cadreASearch}
            onValueChange={setCadreASearch}
          />
          <CommandList className="max-h-[320px] overflow-y-auto">
            {cadreASearch.trim().length === 0 ? (
              filteredCadresForA.length > 0 ? (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-zinc-50 dark:bg-zinc-800/60 border-t border-b flex items-center justify-between">
                    <span>
                      {cadreAFilter === 'WINGS'
                        ? (locale === 'ta' ? 'அனைத்து சார்பு அணி நிர்வாகிகள்' : 'Wing Administrators')
                        : (locale === 'ta' ? 'நிர்வாகிகள் பட்டியல்' : 'Administrators List')}
                    </span>
                    <span className="font-mono text-[10px]">{filteredCadresForA.length} available</span>
                  </div>
                  <CommandGroup>
                    {filteredCadresForA.map((c: any) =>
                      renderCadreSearchItem(c, () => handleSelectCadreA(c))
                    )}
                  </CommandGroup>
                </div>
              ) : (
                <div className="py-6 px-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                  <Search className="w-5 h-5 text-zinc-400" />
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {locale === 'ta' ? 'நிர்வாகிகள் இல்லை' : 'No cadres found in this category'}
                  </p>
                </div>
              )
            ) : cadreASearch.trim().length < 3 ? (
              <div className="py-7 px-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                <Search className="w-5 h-5 text-zinc-400 stroke-[1.75]" />
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {locale === 'ta'
                    ? `இன்னும் ${3 - cadreASearch.trim().length} எழுத்துகள் உள்ளிடவும்...`
                    : `Enter ${3 - cadreASearch.trim().length} more character${3 - cadreASearch.trim().length > 1 ? 's' : ''} to search...`}
                </p>
                <p className="text-[10.5px] text-zinc-400">
                  {locale === 'ta' ? 'தேடல் 3 எழுத்துகளுக்குப் பிறகு தொடங்கும்' : 'API search activates after 3 characters'}
                </p>
              </div>
            ) : isSearchingA || cadreASearch.trim() !== debouncedSearchA.trim() ? (
              <div className="py-8 px-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="font-medium text-zinc-700 dark:text-zinc-300">
                  {locale === 'ta' ? 'நிர்வாகிகள் தேடப்படுகிறார்கள்...' : `Searching for "${cadreASearch}"...`}
                </p>
              </div>
            ) : searchResultsA.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                <AlertCircle className="w-5 h-5 text-zinc-400" />
                <p className="font-bold text-zinc-700 dark:text-zinc-300">
                  {locale === 'ta' ? 'நிர்வாகிகள் எவரும் கிடைக்கவில்லை' : 'No administrators found'}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {locale === 'ta'
                    ? `"${debouncedSearchA}" என்ற தேடலுக்குப் பொருந்தும் நிர்வாகிகள் இல்லை`
                    : `No matching cadres found for "${debouncedSearchA}"`}
                </p>
              </div>
            ) : (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-zinc-50 dark:bg-zinc-800/60 border-b flex items-center justify-between">
                  <span>{locale === 'ta' ? 'தேடல் முடிவுகள்' : 'Search Results'}</span>
                  <span className="font-mono text-[10px]">{searchResultsA.length} found</span>
                </div>
                <CommandGroup>
                  {searchResultsA.map((c: any) =>
                    renderCadreSearchItem(c, () => handleSelectCadreA(c))
                  )}
                </CommandGroup>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[860px] md:max-w-[920px] lg:max-w-[960px] max-h-[92vh] overflow-y-auto p-5 sm:p-7">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Shuffle className="w-5 h-5" />
            <DialogTitle className="text-lg sm:text-xl font-heading font-black tracking-tight">
              {locale === 'ta' ? 'பணி மாறுதல் & பதவி பரிமாற்றம்' : 'Role Transfer & Assignment Swap'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {locale === 'ta'
              ? 'நிர்வாகிகளை கிளை, ஒன்றியம், மாவட்டம் அல்லது சார்பு அணிகளுக்கு இடையே சுலபமாக பணியிட மாற்றம் அல்லது பதவி பரிமாற்றம் செய்யுங்கள்.'
              : 'Seamlessly swap roles between two administrators or reassign a cadre to any role across Kilais, Unions, District, or Wings.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Controls */}
        <Tabs value={activeTab} onValueChange={(val: any) => { setActiveTab(val); setErrorMessage(null); }} className="mt-2">
          <TabsList className="grid grid-cols-2 w-full p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <TabsTrigger value="swap" className="text-xs font-bold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
              {locale === 'ta' ? 'பதவி பரிமாற்றம் (Swap)' : 'Swap Roles'}
            </TabsTrigger>
            <TabsTrigger value="move" className="text-xs font-bold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
              {locale === 'ta' ? 'பணி மாறுதல் (Move)' : 'Reassign Role'}
            </TabsTrigger>
          </TabsList>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}

          {/* ========================================================
              TAB 1: SWAP CADRES
             ======================================================== */}
          <TabsContent value="swap" className="space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-start gap-4">
              {/* Cadre A Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-primary" /> Cadre A (Primary)
                </Label>
                {cadreA ? (
                  renderCadreCard(cadreA, () => setCadreA(null))
                ) : (
                  renderCadreAPopover('Select Cadre A (Type min 3 chars to search)...')
                )}
              </div>

              {/* Flip Button */}
              <div className="flex justify-center sm:pt-14">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleFlipCadres}
                  disabled={!cadreA || !cadreB}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 via-zinc-100 to-amber-500/10 dark:from-zinc-800 dark:to-zinc-700 border hover:scale-110 transition-transform shadow-xs cursor-pointer"
                  title="Switch positions"
                >
                  <ArrowLeftRight className="w-4 h-4 text-primary" />
                </Button>
              </div>

              {/* Cadre B Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" /> Cadre B (Target to Swap)
                </Label>
                {cadreB ? (
                  renderCadreCard(cadreB, () => setCadreB(null), true)
                ) : (
                  <Popover open={isCadreBPickerOpen} onOpenChange={setIsCadreBPickerOpen}>
                    <PopoverTrigger className="flex items-center justify-between w-full h-14 px-3.5 py-2 text-xs rounded-2xl border-2 border-dashed hover:border-amber-500/50 bg-white dark:bg-zinc-900 shadow-xs cursor-pointer transition-colors text-left">
                      <span className="text-muted-foreground flex items-center gap-2 truncate">
                        <Search className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate">Select Cadre B to swap with (Type min 3 chars)...</span>
                      </span>
                      <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[92vw] sm:w-[480px] p-0 shadow-xl rounded-2xl overflow-hidden" align="end">
                      <Command shouldFilter={false} className="rounded-2xl">
                        <div className="p-2 border-b bg-zinc-50 dark:bg-zinc-800/60 flex items-center gap-1.5 overflow-x-auto">
                          {(['ALL', 'SAME_UNIT', 'CROSS_LEVEL', 'WINGS'] as const).map((mode) => {
                            const labels = {
                              ALL: 'All',
                              SAME_UNIT: 'Same Unit',
                              CROSS_LEVEL: 'Cross-Level',
                              WINGS: 'Wings',
                            };
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setCadreBFilter(mode)}
                                className={cn(
                                  "text-[10.5px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap",
                                  cadreBFilter === mode
                                    ? "bg-primary text-white shadow-xs"
                                    : "bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                                )}
                              >
                                {labels[mode]}
                              </button>
                            );
                          })}
                        </div>

                        <CommandInput
                          placeholder="Type min 3 characters (Name, Voter ID, Phone, Kilai)..."
                          value={cadreBSearch}
                          onValueChange={setCadreBSearch}
                        />
                        <CommandList className="max-h-[320px] overflow-y-auto">
                          {cadreBSearch.trim().length === 0 ? (
                            filteredCadresForB.length > 0 ? (
                              <div>
                                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-zinc-50 dark:bg-zinc-800/60 border-t border-b flex items-center justify-between">
                                  <span>
                                    {cadreBFilter === 'WINGS'
                                      ? (locale === 'ta' ? 'அனைத்து சார்பு அணி நிர்வாகிகள்' : 'Wing Administrators')
                                      : (locale === 'ta' ? 'பரிந்துரைக்கப்படும் நிர்வாகிகள்' : 'Suggested for Swap')}
                                  </span>
                                  <span className="font-mono text-[10px]">{filteredCadresForB.length} available</span>
                                </div>
                                <CommandGroup>
                                  {filteredCadresForB.map((c: any) =>
                                    renderCadreSearchItem(c, () => handleSelectCadreB(c))
                                  )}
                                </CommandGroup>
                              </div>
                            ) : (
                              <div className="py-6 px-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                                <Search className="w-5 h-5 text-zinc-400" />
                                <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                                  {locale === 'ta' ? 'நிர்வாகிகள் இல்லை' : 'No cadres found in this category'}
                                </p>
                              </div>
                            )
                          ) : cadreBSearch.trim().length < 3 ? (
                            <div className="py-7 px-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                              <Search className="w-5 h-5 text-zinc-400 stroke-[1.75]" />
                              <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {locale === 'ta'
                                  ? `இன்னும் ${3 - cadreBSearch.trim().length} எழுத்துகள் உள்ளிடவும்...`
                                  : `Enter ${3 - cadreBSearch.trim().length} more character${3 - cadreBSearch.trim().length > 1 ? 's' : ''} to search...`}
                              </p>
                              <p className="text-[10.5px] text-zinc-400">
                                {locale === 'ta' ? 'தேடல் 3 எழுத்துகளுக்குப் பிறகு தொடங்கும்' : 'API search activates after 3 characters'}
                              </p>
                            </div>
                          ) : isSearchingB || cadreBSearch.trim() !== debouncedSearchB.trim() ? (
                            <div className="py-8 px-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                                {locale === 'ta' ? 'நிர்வாகிகள் தேடப்படுகிறார்கள்...' : `Searching for "${cadreBSearch}"...`}
                              </p>
                            </div>
                          ) : filteredSearchResultsB.length === 0 ? (
                            <div className="py-8 px-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                              <AlertCircle className="w-5 h-5 text-zinc-400" />
                              <p className="font-bold text-zinc-700 dark:text-zinc-300">
                                {locale === 'ta' ? 'நிர்வாகிகள் எவரும் கிடைக்கவில்லை' : 'No matching administrators'}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                {locale === 'ta'
                                  ? `"${debouncedSearchB}" என்ற குறிச்சொல்லுக்குத் தகுதியான நிர்வாகிகள் இல்லை.`
                                  : `No matching cadres found for "${debouncedSearchB}" under current filter.`}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-zinc-50 dark:bg-zinc-800/60 border-b flex items-center justify-between">
                                <span>{locale === 'ta' ? 'தேடல் முடிவுகள்' : 'Search Results'}</span>
                                <span className="font-mono text-[10px]">{filteredSearchResultsB.length} found</span>
                              </div>
                              <CommandGroup>
                                {filteredSearchResultsB.map((c: any) =>
                                  renderCadreSearchItem(c, () => handleSelectCadreB(c))
                                )}
                              </CommandGroup>
                            </div>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Swap Preview Box */}
            {cadreA && cadreB && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-amber-500/5 to-primary/10 dark:from-primary/10 dark:via-zinc-800 dark:to-primary/5 border border-primary/20 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Swap Outcome Preview
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Cadre A New Assignment */}
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <p className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary" /> {cadreA.name}
                    </p>
                    <p className="text-muted-foreground text-[11px]">Takes Cadre B&apos;s Post:</p>
                    <p className="font-bold text-primary">
                      {showCustomSwapRoles && customRoleA ? customRoleA : formatDesignation(cadreB.role, locale)}
                    </p>
                    <p className="text-[10.5px] text-zinc-500">
                      Level: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{cadreB.level}</span>
                      {cadreB.wing?.name && ` • ${cadreB.wing.name}`}
                      {cadreB.homeKilai?.name && ` • ${cadreB.homeKilai.name}`}
                      {cadreB.union?.name && ` • ${cadreB.union.name}`}
                    </p>
                  </div>

                  {/* Cadre B New Assignment */}
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <p className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> {cadreB.name}
                    </p>
                    <p className="text-muted-foreground text-[11px]">Takes Cadre A&apos;s Post:</p>
                    <p className="font-bold text-amber-700 dark:text-amber-400">
                      {showCustomSwapRoles && customRoleB ? customRoleB : formatDesignation(cadreA.role, locale)}
                    </p>
                    <p className="text-[10.5px] text-zinc-500">
                      Level: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{cadreA.level}</span>
                      {cadreA.wing?.name && ` • ${cadreA.wing.name}`}
                      {cadreA.homeKilai?.name && ` • ${cadreA.homeKilai.name}`}
                      {cadreA.union?.name && ` • ${cadreA.union.name}`}
                    </p>
                  </div>
                </div>

                {/* Optional Custom Roles Override */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowCustomSwapRoles(!showCustomSwapRoles)}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showCustomSwapRoles ? '− Hide Custom Role Titles' : '+ Customize Role Titles during Swap'}
                  </button>

                  {showCustomSwapRoles && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        placeholder={`Role for ${cadreA.name}`}
                        value={customRoleA}
                        onChange={(e) => setCustomRoleA(e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-zinc-900"
                      />
                      <Input
                        placeholder={`Role for ${cadreB.name}`}
                        value={customRoleB}
                        onChange={(e) => setCustomRoleB(e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleExecuteSwap}
                disabled={!cadreA || !cadreB || swapMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white font-bold"
              >
                {swapMutation.isPending ? 'Swapping Positions...' : 'Confirm Role Swap'}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* ========================================================
              TAB 2: MOVE / REASSIGN CADRE
             ======================================================== */}
          <TabsContent value="move" className="space-y-4 pt-3">
            {/* Cadre to Move */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Cadre to Reassign
              </Label>
              {cadreA ? (
                renderCadreCard(cadreA, () => setCadreA(null))
              ) : (
                renderCadreAPopover('Select Cadre to reassign (Type min 3 chars)...')
              )}
            </div>

            {/* Destination Configuration */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Destination Assignment
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Level */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Level *</Label>
                  <Select value={moveLevel} onValueChange={(val: any) => { setMoveLevel(val || 'KILAI'); setMoveRole(''); }}>
                    <SelectTrigger className="w-full bg-white dark:bg-zinc-900">
                      <SelectValue placeholder="Select level">
                        {moveLevel === 'DISTRICT' ? 'District' : moveLevel === 'UNION' ? 'Union' : 'Kilai'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DISTRICT">District</SelectItem>
                      <SelectItem value="UNION">Union</SelectItem>
                      <SelectItem value="KILAI">Kilai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Wing */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Wing / Department</Label>
                  <Select value={moveWingId} onValueChange={(val: any) => { setMoveWingId(val || 'NONE'); setMoveRole(''); }}>
                    <SelectTrigger className="w-full bg-white dark:bg-zinc-900">
                      <SelectValue placeholder="Select Wing">
                        {moveWingId === 'NONE' || !moveWingId
                          ? 'None (General Administration)'
                          : wings.find((w: any) => String(w.id) === String(moveWingId))?.name || 'None (General Administration)'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None (General Administration)</SelectItem>
                      {wings.map((w: any) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <Label className="text-xs">District</Label>
                  <Select value={moveDistrictId} onValueChange={(val: any) => setMoveDistrictId(val || '')}>
                    <SelectTrigger className="w-full bg-white dark:bg-zinc-900">
                      <SelectValue placeholder="Select district">
                        {districts.find((d: any) => String(d.id) === String(moveDistrictId))?.name || 'Select district'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d: any) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Union (if UNION or KILAI) */}
                {moveLevel !== 'DISTRICT' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Union *</Label>
                    <Select 
                      value={moveUnionId} 
                      onValueChange={(val: any) => { 
                        setMoveUnionId(val || '');
                        setMoveKilaiId('');
                      }}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-zinc-900">
                        <SelectValue placeholder="Select union">
                          {availableUnions.find((u: any) => String(u.id || u._id) === String(moveUnionId))?.name || 'Select union'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnions.map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id || u._id)}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Kilai (if KILAI) */}
                {moveLevel === 'KILAI' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kilai *</Label>
                    <Select value={moveKilaiId} onValueChange={(val: any) => setMoveKilaiId(val || '')}>
                      <SelectTrigger className="w-full bg-white dark:bg-zinc-900">
                        <SelectValue placeholder={moveUnionId ? "Select kilai" : "Select union first"}>
                          {availableKilais.find((k: any) => String(k.id || k._id) === String(moveKilaiId))?.name || (moveUnionId ? "Select kilai" : "Select union first")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableKilais.map((k: any) => (
                          <SelectItem key={k.id} value={String(k.id || k._id)}>
                            {k.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Role Designation */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Designation / Role *</Label>
                  <Select value={moveRole} onValueChange={(val: any) => setMoveRole(val || '')}>
                    <SelectTrigger className="w-full bg-white dark:bg-zinc-900">
                      <SelectValue placeholder="Select role">
                        {moveRole === '__CUSTOM__'
                          ? (customRole ? customRole : '+ Custom Role...')
                          : moveRole
                          ? formatDesignation(moveRole, locale)
                          : 'Select role'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {presetRoles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {formatDesignation(r, locale)}
                        </SelectItem>
                      ))}
                      <SelectItem value="__CUSTOM__">+ Custom Role...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Role Input */}
              {moveRole === '__CUSTOM__' && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs">Custom Role Name *</Label>
                  <Input
                    placeholder="Enter custom designation (e.g. Incharge / Spokesperson)"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleExecuteMove}
                disabled={!cadreA || moveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {moveMutation.isPending ? 'Reassigning...' : 'Confirm Reassignment'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
