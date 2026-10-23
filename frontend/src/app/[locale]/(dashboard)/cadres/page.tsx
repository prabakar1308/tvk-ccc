'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Plus, 
  UserCheck, 
  UserPlus, 
  Trophy, 
  Edit2, 
  Trash2, 
  UploadCloud, 
  LayoutGrid, 
  List, 
  Phone,
  Shield,
  Building2,
  Sparkles,
  MapPin,
  Users,
  RotateCcw,
  X,
  Filter,
  Check,
  Award
} from "lucide-react";
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { translatePersonNameToTamil } from '@/lib/name-translations';
import { useCadres, useDeleteCadre } from '@/hooks/use-cadres';
import { useUnions } from '@/hooks/use-unions';
import { useKilais } from '@/hooks/use-kilais';
import { useWings } from '@/hooks/use-wings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { CadreViewDialog } from '@/components/cadre-view-dialog';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { UserAvatar } from '@/components/ui/user-avatar';
import { CadreCard } from '@/components/cadre-card';
import { cn } from '@/lib/utils';

export default function CadresPage() {
  const locale = useLocale();
  const t = useTranslations('Cadres');
  const tCommon = useTranslations('Common');
  const tForms = useTranslations('Forms');

  // Primary Level Filter
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  
  // Secondary / Drilldown Filters
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterUnionId, setFilterUnionId] = useState<string>('');
  const [filterKilaiId, setFilterKilaiId] = useState<string>('');
  const [filterWingId, setFilterWingId] = useState<string>('');
  const [wingsFilterType, setWingsFilterType] = useState<'DISTRICT' | 'UNION'>('DISTRICT');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<'TABLE' | 'TILE'>('TILE');
  const [includeKilai, setIncludeKilai] = useState(false);
  
  // URL Params Synchronization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const level = params.get('level');
      const filterLevelParam = params.get('filterLevel');
      const unionId = params.get('unionId');
      
      if (level) {
        setLevelFilter(level);
        setFilterLevel(level);
      } else if (filterLevelParam) {
        setLevelFilter('ALL');
        setFilterLevel(filterLevelParam);
      }
      
      if (unionId) {
        setFilterUnionId(unionId);
      }
      
      const includeKilaiParam = params.get('includeKilai');
      if (includeKilaiParam === 'true') {
        setIncludeKilai(true);
      }
    }
  }, []);

  // Fetch standard cadres and wing cadres concurrently
  const { data: allCadres = [], isLoading: isLoadingAll } = useCadres({});
  const { data: wingCadres = [], isLoading: isLoadingWings } = useCadres({ isWing: 'true' });
  const combinedCadres = useMemo(() => [...allCadres, ...wingCadres], [allCadres, wingCadres]);
  const { data: unions = [] } = useUnions();
  const { data: kilais = [] } = useKilais();
  const { data: wings = [] } = useWings();
  const deleteMutation = useDeleteCadre();

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [viewingCadre, setViewingCadre] = useState<any | null>(null);
  const [callConfirmation, setCallConfirmation] = useState<{name: string, phone: string} | null>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, cadre: any) => {
    e.stopPropagation();
    setEditingId(cadre.id);
    setIsModalOpen(true);
  };

  const handleOpenView = (cadre: any) => {
    setViewingCadre(cadre);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmation(id);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setLevelFilter('ALL');
    setFilterLevel('ALL');
    setFilterUnionId('');
    setFilterKilaiId('');
    setFilterWingId('');
    setSelectedRoleFilter('ALL');
    setIncludeKilai(false);
  };

  // Active filter count (excluding default ALL)
  const isFiltered = Boolean(
    searchQuery ||
    levelFilter !== 'ALL' ||
    filterLevel !== 'ALL' ||
    filterUnionId ||
    filterKilaiId ||
    filterWingId ||
    selectedRoleFilter !== 'ALL' ||
    includeKilai
  );

  // Live Count Metrics by Tier
  const tierCounts = useMemo(() => {
    return {
      ALL: allCadres.length + wingCadres.length,
      DISTRICT: allCadres.filter((c) => c.level === 'DISTRICT').length,
      UNION: allCadres.filter((c) => c.level === 'UNION').length,
      WINGS: wingCadres.length,
      KILAI: allCadres.filter((c) => c.level === 'KILAI').length,
    };
  }, [allCadres, wingCadres]);

  // Executive Tier Selector Configuration
  const TIERS = [
    {
      id: 'ALL',
      title: 'All Administrators',
      subtitle: 'Complete Cadre Base',
      icon: Users,
      count: tierCounts.ALL,
      color: 'from-[#8F0A1B] to-[#B81930]',
      activeBorder: 'border-[#8F0A1B] shadow-[0_8px_25px_-4px_rgba(143,10,27,0.35)]',
      activeGradient: 'bg-gradient-to-br from-[#8F0A1B] via-[#9E0D21] to-[#730715]',
      badgeActive: 'bg-white/20 text-white',
      badgeInactive: 'bg-[#8F0A1B]/10 text-[#8F0A1B] dark:text-red-400',
    },
    {
      id: 'DISTRICT',
      title: 'District Leadership',
      subtitle: 'Apex Administration',
      icon: Shield,
      count: tierCounts.DISTRICT,
      color: 'from-[#8F0A1B] to-[#D97706]',
      activeBorder: 'border-[#8F0A1B] shadow-[0_8px_25px_-4px_rgba(143,10,27,0.35)]',
      activeGradient: 'bg-gradient-to-br from-[#8F0A1B] to-[#580510]',
      badgeActive: 'bg-white/20 text-white',
      badgeInactive: 'bg-[#8F0A1B]/10 text-[#8F0A1B] dark:text-red-400',
    },
    {
      id: 'UNION',
      title: 'Org Unit / Union',
      subtitle: 'Block & Town Councils',
      icon: Building2,
      count: tierCounts.UNION,
      color: 'from-amber-600 to-amber-700',
      activeBorder: 'border-amber-500 shadow-[0_8px_25px_-4px_rgba(217,119,6,0.35)]',
      activeGradient: 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800',
      badgeActive: 'bg-white/20 text-white',
      badgeInactive: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    },
    {
      id: 'WINGS',
      title: 'Special Wings',
      subtitle: 'Frontline Divisions',
      icon: Sparkles,
      count: tierCounts.WINGS,
      color: 'from-purple-600 to-indigo-600',
      activeBorder: 'border-purple-600 shadow-[0_8px_25px_-4px_rgba(124,58,237,0.35)]',
      activeGradient: 'bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900',
      badgeActive: 'bg-white/20 text-white',
      badgeInactive: 'bg-purple-500/15 text-purple-800 dark:text-purple-300',
    },
    {
      id: 'KILAI',
      title: 'Kilai / Grassroots',
      subtitle: 'Village & Booth Units',
      icon: MapPin,
      count: tierCounts.KILAI,
      color: 'from-emerald-600 to-teal-700',
      activeBorder: 'border-emerald-600 shadow-[0_8px_25px_-4px_rgba(5,150,105,0.35)]',
      activeGradient: 'bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900',
      badgeActive: 'bg-white/20 text-white',
      badgeInactive: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
    },
  ];

/**
 * Match a raw role against selected role filter chip
 */
function matchesRoleFilter(rawRole: string | undefined | null, filterId: string): boolean {
  if (filterId === 'ALL') return true;
  if (!rawRole) return false;

  const upper = rawRole.toUpperCase().trim();

  if (filterId === 'SECRETARY') {
    // Secretary only - exclude Joint Secretary and Deputy Secretary
    const isJointOrDeputy = upper.includes('JOINT') || upper.includes('DEPUTY');
    return !isJointOrDeputy && upper.includes('SECRETARY');
  }

  if (filterId === 'JOINT_SECRETARY') {
    return upper.includes('JOINT');
  }

  if (filterId === 'TREASURER') {
    return upper.includes('TREASURER');
  }

  if (filterId === 'DEPUTY_SECRETARY') {
    return upper.includes('DEPUTY');
  }

  if (filterId === 'EC') {
    return (
      upper.includes('EXECUTIVE') ||
      upper === 'EC' ||
      upper === 'EC MEMBER' ||
      upper === 'EC_MEMBER' ||
      upper.startsWith('EC ') ||
      upper.endsWith(' EC')
    );
  }

  return false;
}

  // Quick Role Filter Chips
  const ROLE_CHIPS = [
    { id: 'ALL', label: 'All Roles' },
    { id: 'SECRETARY', label: 'Secretary', icon: Shield },
    { id: 'JOINT_SECRETARY', label: 'Joint Secretary', icon: Users },
    { id: 'TREASURER', label: 'Treasurer', icon: Award },
    { id: 'DEPUTY_SECRETARY', label: 'Deputy Secretary', icon: Shield },
    { id: 'EC', label: 'EC Member', icon: UserCheck },
  ];

  // Current dataset source based on active level
  const currentSourceCadres = useMemo(() => {
    if (levelFilter === 'WINGS') return wingCadres;
    if (levelFilter === 'ALL') return [...allCadres, ...wingCadres];
    return allCadres;
  }, [levelFilter, allCadres, wingCadres]);

  const isLoading = levelFilter === 'WINGS' ? isLoadingWings : isLoadingAll;

  // Multi-dimensional filtering logic
  const filteredCadres = useMemo(() => {
    return currentSourceCadres.filter((cadre) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cadre.name?.toLowerCase().includes(q) ||
        cadre.memberId?.toLowerCase().includes(q) ||
        cadre.phone?.includes(q) ||
        cadre.area?.toLowerCase().includes(q) ||
        cadre.aadhaarNumber?.includes(q);

      if (!matchesSearch) return false;

      // 2. Role Chip Filter
      if (selectedRoleFilter !== 'ALL') {
        const matchesMainRole = matchesRoleFilter(cadre.role, selectedRoleFilter);
        const matchesOfficeBearer = cadre.officeBearerRoles?.some((ob: any) =>
          matchesRoleFilter(ob?.role, selectedRoleFilter)
        );
        if (!matchesMainRole && !matchesOfficeBearer) {
          return false;
        }
      }

      // 3. Wings Tier Specific Drilldowns
      if (levelFilter === 'WINGS') {
        const matchesWingType = cadre.level === wingsFilterType;
        const matchesWingUnion = wingsFilterType === 'UNION' && filterUnionId ? cadre.unionId === filterUnionId : true;
        const matchesWing = filterWingId ? cadre.wingId === filterWingId : true;
        return matchesWingType && matchesWingUnion && matchesWing;
      }

      // 4. Standard Levels Filter
      const currentTabLevel = levelFilter === 'ALL' ? filterLevel : levelFilter;
      let matchesLevel = currentTabLevel === 'ALL' || cadre.level === currentTabLevel;

      if (includeKilai && filterUnionId && currentTabLevel === 'UNION') {
        matchesLevel = cadre.level === 'UNION' || cadre.level === 'KILAI';
      }

      const matchesUnion = filterUnionId ? cadre.unionId === filterUnionId : true;
      const matchesKilai = filterKilaiId ? cadre.homeKilaiId === filterKilaiId : true;

      return matchesLevel && matchesUnion && matchesKilai;
    });
  }, [
    currentSourceCadres,
    searchQuery,
    selectedRoleFilter,
    levelFilter,
    wingsFilterType,
    filterUnionId,
    filterWingId,
    filterLevel,
    includeKilai,
    filterKilaiId,
  ]);

  const getRoleBadge = (role: string | undefined, level: string, isShort = false) => {
    let displayRole = role || 'Administrator';
    if (isShort && displayRole === 'Executive Committee Member') {
      displayRole = 'EC Member';
    }
    
    if (level === 'DISTRICT') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#8F0A1B] text-white border border-[#8F0A1B]/20 shadow-sm">{displayRole}</span>;
    }
    if (level === 'UNION') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#FFC72C] text-black border border-amber-400/40 shadow-sm">{displayRole}</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">{displayRole}</span>;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {t('title')}
            </h1>
            <span className="bg-primary/10 text-primary border border-primary/25 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
              {tierCounts.ALL} Total
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base font-medium">
            {t('description')}
          </p>
        </div>
        {/* Actions buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <Link href="/cadres/import" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-11 rounded-xl px-4 sm:px-5 font-semibold border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-2xs"
            >
              <UploadCloud className="w-4 h-4 mr-2 text-primary" />
              {tCommon('importExcel')}
            </Button>
          </Link>

          <Button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold shadow-md shadow-primary/20 h-11 px-5 sm:px-6 rounded-xl transition-transform active:scale-95"
          >
            <Plus className="mr-2 h-5 w-5" /> {t('register')}
          </Button>
        </div>
      </div>

      {/* Top 3 Executive Metric Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
        <Card
          onClick={() => handleResetFilters()}
          className="relative overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg bg-white dark:bg-zinc-900 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-[#FFC72C] opacity-80 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 sm:p-6 flex items-center gap-4">
            <div className="p-3.5 bg-primary/10 text-primary rounded-xl shrink-0 group-hover:scale-110 transition-transform">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('totalCadres')}</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-zinc-900 dark:text-zinc-100 mt-1">
                {tierCounts.ALL}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg bg-white dark:bg-zinc-900 rounded-2xl transition-all duration-300 hover:-translate-y-1 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-[#FFC72C] opacity-80 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 sm:p-6 flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/10 text-amber-600 dark:text-manjal rounded-xl shrink-0 group-hover:scale-110 transition-transform">
              <UserPlus className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('newThisMonth')}</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-zinc-900 dark:text-zinc-100 mt-1">
                +{tierCounts.ALL > 0 ? 1 : 0}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg bg-white dark:bg-zinc-900 rounded-2xl transition-all duration-300 hover:-translate-y-1 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 sm:p-6 flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('activeCadres')}</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-zinc-900 dark:text-zinc-100 mt-1">
                100%
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REPLACED TABS: Executive Tier Command Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Browse by Organizational Level
            </span>
          </div>
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          )}
        </div>

        {/* 5-Column Interactive Tier Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {TIERS.map((tier) => {
            const isActive = levelFilter === tier.id;
            const TierIcon = tier.icon;

            return (
              <button
                key={tier.id}
                onClick={() => {
                  setLevelFilter(tier.id);
                  setFilterLevel('ALL');
                  setFilterUnionId('');
                  setFilterKilaiId('');
                  setFilterWingId('');
                  setWingsFilterType('DISTRICT');
                }}
                className={cn(
                  'group relative p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[105px] select-none',
                  isActive
                    ? cn(tier.activeGradient, tier.activeBorder, 'text-white scale-[1.02] z-10')
                    : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
                )}
              >
                {/* Header row: Icon & Count */}
                <div className="flex items-center justify-between gap-2 w-full">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0',
                      isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    )}
                  >
                    <TierIcon className="w-4 h-4" />
                  </div>

                  <span
                    className={cn(
                      'font-heading font-black text-base sm:text-lg px-2.5 py-0.5 rounded-full leading-none shrink-0 transition-colors',
                      isActive ? tier.badgeActive : tier.badgeInactive
                    )}
                  >
                    {tier.count}
                  </span>
                </div>

                {/* Bottom row: Title & Subtitle */}
                <div className="mt-3">
                  <h3
                    className={cn(
                      'font-heading font-black text-sm sm:text-[15px] leading-tight line-clamp-1',
                      isActive ? 'text-white' : 'text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors'
                    )}
                  >
                    {tier.title}
                  </h3>
                  <p
                    className={cn(
                      'text-[11px] font-medium leading-tight mt-0.5 line-clamp-1',
                      isActive ? 'text-white/80' : 'text-muted-foreground'
                    )}
                  >
                    {tier.subtitle}
                  </p>
                </div>

                {/* Subtle active indicator glow dot */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FFC72C] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contextual Drilldown Filters (Displayed based on selected Tier) */}
      {(levelFilter === 'WINGS' || levelFilter === 'UNION' || levelFilter === 'KILAI' || (levelFilter === 'ALL' && filterLevel !== 'ALL')) && (
        <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <span>Refine {levelFilter === 'WINGS' ? 'Wings' : levelFilter === 'UNION' ? 'Org Unit' : levelFilter === 'KILAI' ? 'Kilai' : 'Level'} Selection:</span>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* WINGS TIER DRILLDOWN */}
            {levelFilter === 'WINGS' && (
              <>
                <div className="inline-flex w-full sm:w-auto bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl h-10 border border-zinc-200/60 dark:border-zinc-700/60">
                  <button
                    onClick={() => { setWingsFilterType('DISTRICT'); setFilterUnionId(''); setFilterWingId(''); }}
                    className={cn(
                      'flex-1 sm:flex-initial px-3.5 h-full rounded-lg text-xs font-bold transition-all cursor-pointer',
                      wingsFilterType === 'DISTRICT'
                        ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    )}
                  >
                    District Wings
                  </button>
                  <button
                    onClick={() => { setWingsFilterType('UNION'); setFilterWingId(''); }}
                    className={cn(
                      'flex-1 sm:flex-initial px-3.5 h-full rounded-lg text-xs font-bold transition-all cursor-pointer',
                      wingsFilterType === 'UNION'
                        ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    )}
                  >
                    Org Unit Wings
                  </button>
                </div>

                {wingsFilterType === 'UNION' && (
                  <div className="w-full sm:w-64 min-w-[200px]">
                    <Select value={filterUnionId} onValueChange={(v) => { setFilterUnionId(v || ''); setFilterWingId(''); }}>
                      <SelectTrigger className="w-full min-w-[200px] h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-xs font-semibold">
                        <SelectValue placeholder={t('selectUnion')}>
                          {filterUnionId ? unions.find((u: any) => String(u.id || u._id) === filterUnionId)?.name : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {unions.map((u: any) => (
                          <SelectItem key={String(u.id || u._id)} value={String(u.id || u._id)}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="w-full sm:w-72 min-w-[200px]">
                  <Select value={filterWingId} onValueChange={(v) => setFilterWingId(v || '')}>
                    <SelectTrigger className="w-full min-w-[200px] h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-xs font-semibold">
                      <SelectValue placeholder="All Special Wings">
                        {filterWingId ? wings.find((w: any) => String(w.id || w._id) === filterWingId)?.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Special Wings</SelectItem>
                      {wings.map((w: any) => (
                        <SelectItem key={String(w.id || w._id)} value={String(w.id || w._id)}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* UNION TIER DRILLDOWN */}
            {(levelFilter === 'UNION' || (levelFilter === 'ALL' && filterLevel === 'UNION')) && (
              <>
                <div className="w-full sm:w-64 min-w-[200px]">
                  <Select value={filterUnionId} onValueChange={(v) => { setFilterUnionId(v || ''); setFilterKilaiId(''); }}>
                    <SelectTrigger className="w-full min-w-[200px] h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-xs font-semibold">
                      <SelectValue placeholder="All Org Units">
                        {filterUnionId ? unions.find((u: any) => String(u.id || u._id) === filterUnionId)?.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Org Units</SelectItem>
                      {unions.map((u: any) => (
                        <SelectItem key={String(u.id || u._id)} value={String(u.id || u._id)}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {filterUnionId && (
                  <label className="flex items-center gap-2 bg-primary/5 hover:bg-primary/10 px-3.5 h-10 rounded-xl border border-primary/20 cursor-pointer select-none transition-colors w-full sm:w-auto justify-center sm:justify-start">
                    <Checkbox
                      id="includeKilai"
                      checked={includeKilai}
                      onCheckedChange={(c) => setIncludeKilai(!!c)}
                    />
                    <span className="text-xs font-bold text-primary">
                      Include Kilai Cadres
                    </span>
                  </label>
                )}
              </>
            )}

            {/* KILAI TIER DRILLDOWN */}
            {(levelFilter === 'KILAI' || (levelFilter === 'ALL' && filterLevel === 'KILAI')) && (
              <>
                <div className="w-full sm:w-64 min-w-[200px]">
                  <Select value={filterUnionId} onValueChange={(v) => { setFilterUnionId(v || ''); setFilterKilaiId(''); }}>
                    <SelectTrigger className="w-full min-w-[200px] h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-xs font-semibold">
                      <SelectValue placeholder="1. Select Org Unit First">
                        {filterUnionId ? unions.find((u: any) => String(u.id || u._id) === filterUnionId)?.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {unions.map((u: any) => (
                        <SelectItem key={String(u.id || u._id)} value={String(u.id || u._id)}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-64 min-w-[200px]">
                  <Select value={filterKilaiId} onValueChange={(v) => setFilterKilaiId(v || '')} disabled={!filterUnionId}>
                    <SelectTrigger className="w-full min-w-[200px] h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-xs font-semibold">
                      <SelectValue placeholder={filterUnionId ? "2. Select Kilai" : "Select Org Unit first"}>
                        {filterKilaiId ? kilais.find((k: any) => String(k.id || k._id) === filterKilaiId)?.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Kilais in this Union</SelectItem>
                      {kilais.filter((k: any) => String(k.unionId) === filterUnionId).map((k: any) => (
                        <SelectItem key={String(k.id || k._id)} value={String(k.id || k._id)}>{k.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Control Bar: Search Input, Quick Role Chips, View Switcher */}
      <div className="bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        {/* Top: Search and View Mode Switcher */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-10 bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus-visible:ring-primary/30 rounded-xl text-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Switcher (Tile / Table) & Counter */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Showing <span className="font-bold text-foreground">{filteredCadres.length}</span> of {tierCounts[levelFilter as keyof typeof tierCounts] ?? tierCounts.ALL}
            </div>

            <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl h-10 border border-zinc-200/60 dark:border-zinc-700/60">
              <button
                onClick={() => setViewType('TILE')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-bold transition-all cursor-pointer',
                  viewType === 'TILE'
                    ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
                title="Tile Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Tiles</span>
              </button>
              <button
                onClick={() => setViewType('TABLE')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-bold transition-all cursor-pointer',
                  viewType === 'TABLE'
                    ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
                title="Table View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: Quick Role Filter Pills (Uniform width & responsive grid alignment across all resolutions) */}
        <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Filter By Role:
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
            {ROLE_CHIPS.map((chip) => {
              const isChipActive = selectedRoleFilter === chip.id;
              const ChipIcon = chip.icon;

              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedRoleFilter(chip.id)}
                  className={cn(
                    'inline-flex items-center justify-center gap-1.5 px-1.5 py-2 rounded-xl text-[11.5px] xl:text-xs font-bold transition-all cursor-pointer select-none w-full min-w-0',
                    isChipActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900'
                  )}
                >
                  {ChipIcon && <ChipIcon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area: Cards Grid or Table */}
      <div id="cadres-table-section" className="scroll-mt-20">
        {isLoading ? (
          <div className="py-20 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">{t('loading')}</p>
          </div>
        ) : filteredCadres.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('noCadres')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No administrators match your current filter settings. Try clearing your search or switching levels.
            </p>
            {isFiltered && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="mt-2 rounded-xl text-xs font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                Reset Filters
              </Button>
            )}
          </div>
        ) : viewType === 'TILE' ? (
          /* Responsive Auto-Fill Grid with Minimum Card Width */
          <div className="grid gap-5 sm:gap-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {filteredCadres.map((cadre) => (
              <CadreCard
                key={cadre.id}
                cadre={cadre}
                minWidth="240px"
                showMemberId={true}
                showLevelBadge={levelFilter === 'ALL'}
                showLocation={true}
                onView={(c) => handleOpenView(c)}
                onEdit={(e, c) => handleOpenEdit(e, c)}
                onDelete={(e, id) => handleDelete(e, id)}
                onCall={(person) => setCallConfirmation(person)}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/60">
                <TableRow className="hover:bg-transparent border-b-zinc-200/80 dark:border-zinc-800">
                  <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 py-3.5">{t('memberId')}</TableHead>
                  <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 py-3.5">{tForms('name')}</TableHead>
                  <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 py-3.5">{t('level')}</TableHead>
                  <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 py-3.5">{t('designation')}</TableHead>
                  <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 py-3.5">Place / Area</TableHead>
                  <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 py-3.5">{tForms('phone')}</TableHead>
                  <TableHead className="font-bold text-zinc-700 dark:text-zinc-300 py-3.5 text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCadres.map((cadre) => (
                  <TableRow
                    key={cadre.id}
                    className="hover:bg-primary/[0.03] transition-colors group border-b border-zinc-100 dark:border-zinc-800 cursor-pointer"
                    onClick={() => handleOpenView(cadre)}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground py-3.5">
                      {cadre.memberId}
                    </TableCell>
                    <TableCell className="font-bold text-sm py-3.5 text-foreground flex items-center gap-3">
                      <UserAvatar
                        src={cadre.photoUrl}
                        name={locale === 'ta' && cadre.name ? translatePersonNameToTamil(cadre.name) : cadre.name}
                        size="sm"
                        ring="default"
                        elevation="none"
                      />
                      <span className="font-extrabold group-hover:text-primary transition-colors">
                        {locale === 'ta' && cadre.name ? translatePersonNameToTamil(cadre.name) : cadre.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 font-bold text-xs text-primary">
                      {cadre.level}
                    </TableCell>
                    <TableCell className="py-3.5">
                      {getRoleBadge(cadre.role, cadre.level)}
                      {cadre.wing && (
                        <div className="mt-1 text-[11px] font-semibold text-muted-foreground">
                          {cadre.wing.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-muted-foreground font-medium">
                      {cadre.area ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          {cadre.area}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="font-medium py-3.5 text-muted-foreground">
                      {cadre.phone ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCallConfirmation({ 
                              name: locale === 'ta' && cadre.name ? translatePersonNameToTamil(cadre.name) : (cadre.name || ''), 
                              phone: cadre.phone || '' 
                            });
                          }}
                          className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Phone className="w-3 h-3" />
                          {cadre.phone}
                        </button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right py-3.5">
                      <div className="flex justify-end gap-1 transition-opacity">
                        <Button
                          onClick={(e) => handleOpenEdit(e, cadre)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full"
                          title="Edit administrator"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={(e) => handleDelete(e, cadre.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                          title="Delete administrator"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Cadre Create/Edit Dialog */}
      <CadreFormDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingId={editingId}
        cadres={combinedCadres}
        defaultLevel="DISTRICT"
        lockLevel={false}
      />

      {/* Cadre View Profile Dialog */}
      <CadreViewDialog
        isOpen={!!viewingCadre}
        onOpenChange={(open) => !open && setViewingCadre(null)}
        cadre={viewingCadre}
      />

      {/* Call Confirmation Dialog */}
      <CallConfirmationDialog
        person={callConfirmation}
        onOpenChange={(open) => !open && setCallConfirmation(null)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{tCommon('delete')}</DialogTitle>
            <DialogDescription className="pt-2">
              {t('deleteConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmation) {
                  deleteMutation.mutate(deleteConfirmation, {
                    onSuccess: () => {
                      setDeleteConfirmation(null);
                    },
                  });
                }
              }}
            >
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
