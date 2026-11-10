'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Download,
  Building2,
  Store,
  MapPin,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getOrgUnitName } from '@/lib/org-unit-translations';

export interface BoothsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  isAdvancedOpen: boolean;
  onToggleAdvanced: () => void;
  filterUnionId: string;
  onUnionChange: (val: string) => void;
  filterPanchayatId: string;
  onPanchayatChange: (val: string) => void;
  filterVillageId: string;
  onVillageChange: (val: string) => void;
  filterAgentId: string;
  onAgentStatusChange: (val: string) => void;
  onClearFilters: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onExportCsv: () => void;
  hasPaginatedBooths: boolean;
  allExpanded: boolean;
  onToggleAllExpanded: () => void;
  unions: any[] | undefined;
  panchayats: any[] | undefined;
  villages: any[] | undefined;
  dataSectionRef?: React.RefObject<HTMLDivElement | null>;
}

export function BoothsFiltersComponent({
  search,
  onSearchChange,
  isAdvancedOpen,
  onToggleAdvanced,
  filterUnionId,
  onUnionChange,
  filterPanchayatId,
  onPanchayatChange,
  filterVillageId,
  onVillageChange,
  filterAgentId,
  onAgentStatusChange,
  onClearFilters,
  viewMode,
  onViewModeChange,
  onExportCsv,
  hasPaginatedBooths,
  allExpanded,
  onToggleAllExpanded,
  unions,
  panchayats,
  villages,
  dataSectionRef,
}: BoothsFiltersProps) {
  const locale = useLocale();
  const t = useTranslations('Booths');
  const tCommon = useTranslations('Common');

  // Local immediate search input state to prevent typing lag
  const [localSearch, setLocalSearch] = React.useState(search);

  React.useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  React.useEffect(() => {
    if (localSearch === search) return;
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  const activeUnionObj = React.useMemo(() => {
    if (!filterUnionId || filterUnionId === 'all') return null;
    return unions?.find(
      (u: any) => String(u.id || u._id) === String(filterUnionId)
    );
  }, [unions, filterUnionId]);

  const activePanchayatObj = React.useMemo(() => {
    if (!filterPanchayatId || filterPanchayatId === 'all') return null;
    return panchayats?.find(
      (p: any) => String(p.id) === String(filterPanchayatId)
    );
  }, [panchayats, filterPanchayatId]);

  const activeVillageObj = React.useMemo(() => {
    if (!filterVillageId || filterVillageId === 'all') return null;
    return villages?.find(
      (v: any) => String(v.id) === String(filterVillageId)
    );
  }, [villages, filterVillageId]);

  const activeFiltersCount = [
    filterUnionId && filterUnionId !== 'all',
    filterPanchayatId && filterPanchayatId !== 'all',
    filterVillageId && filterVillageId !== 'all',
    filterAgentId,
  ].filter(Boolean).length;

  const hasAnyFilter = activeFiltersCount > 0 || Boolean(search);

  return (
    <div
      ref={dataSectionRef}
      className="flex flex-col bg-card p-3 sm:p-4 rounded-xl shadow-sm border border-primary/10 gap-3 sm:gap-4 scroll-mt-20"
    >
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between w-full">
        {/* Left Controls: Search & Advanced Search Button */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-0 w-full sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t('searchPlaceholder')}
              className="pl-9 pr-9 h-10 sm:h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-xl text-xs sm:text-sm transition-all w-full"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/60 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant={
              isAdvancedOpen || activeFiltersCount > 0
                ? 'default'
                : 'outline'
            }
            className={`h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl gap-2 border-primary/20 transition-all font-semibold text-xs sm:text-sm shrink-0 justify-center w-full sm:w-auto cursor-pointer ${
              isAdvancedOpen || activeFiltersCount > 0
                ? 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/30'
                : 'text-muted-foreground hover:text-primary'
            }`}
            onClick={onToggleAdvanced}
          >
            <Filter className="w-4 h-4" />
            <span>{locale === 'ta' ? 'மேம்பட்ட தேடல்' : 'Advanced Search'}</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isAdvancedOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </div>

        {/* Right Controls: Expand All, View Switcher & Export CSV */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between sm:justify-end shrink-0 flex-wrap">
          {viewMode === 'list' && hasPaginatedBooths && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleAllExpanded}
              className="h-10 sm:h-11 px-3 rounded-xl text-xs font-semibold text-primary border-primary/20 hover:bg-primary/10 flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
              title={
                allExpanded
                  ? locale === 'ta'
                    ? 'அனைத்தையும் சுருக்கு'
                    : 'Collapse All'
                  : locale === 'ta'
                  ? 'அனைத்தையும் விரி'
                  : 'Expand All'
              }
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">
                    {locale === 'ta' ? 'அனைத்தையும் சுருக்கு' : 'Collapse All'}
                  </span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">
                    {locale === 'ta' ? 'அனைத்தையும் விரி' : 'Expand All'}
                  </span>
                </>
              )}
            </Button>
          )}
          <div className="flex bg-muted/40 p-1 rounded-xl border border-primary/10 shadow-inner h-10 sm:h-11 items-center shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`h-full px-2.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-background shadow-xs text-primary ring-1 ring-black/5'
                  : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="Tile View"
            >
              <LayoutGrid className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`h-full px-2.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-background shadow-xs text-primary ring-1 ring-black/5'
                  : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="List View"
            >
              <List className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
          <Button
            variant="outline"
            onClick={onExportCsv}
            className="h-10 sm:h-11 rounded-xl px-3 sm:px-4 font-semibold text-xs sm:text-sm border-primary/20 text-primary hover:bg-[#eae8d3] flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{tCommon('exportCsv')}</span>
          </Button>
        </div>
      </div>

      {/* Advanced Search Panel */}
      {isAdvancedOpen && (
        <div className="mt-2 bg-white dark:bg-zinc-900/60 p-4 sm:p-5 rounded-xl border border-primary/10 shadow-xs animate-in slide-in-from-top-2 fade-in duration-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
              <Filter className="w-4 h-4" />
              <span>{locale === 'ta' ? 'மேம்பட்ட வடிப்பான்கள்' : 'Advanced Filters'}</span>
              {activeFiltersCount > 0 && (
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                  {activeFiltersCount} {locale === 'ta' ? 'செயலில்' : 'Active'}
                </Badge>
              )}
            </div>

            {hasAnyFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 sm:h-8 text-xs font-semibold text-destructive hover:text-destructive bg-destructive/10 hover:bg-destructive/20 px-3 rounded-lg cursor-pointer transition-colors"
                onClick={onClearFilters}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                {locale === 'ta' ? 'வடிப்பான்களை நீக்கு' : 'Clear Filters'}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Org Unit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>{locale === 'ta' ? 'அமைப்பு அலகு' : 'Org Unit'}</span>
              </Label>
              <Select
                value={filterUnionId || 'all'}
                onValueChange={(v) => onUnionChange(v === 'all' ? '' : v || '')}
              >
                <SelectTrigger className="w-full !h-10 sm:!h-11 bg-background border-primary/20 hover:border-primary/40 transition-colors rounded-xl shadow-xs text-xs sm:text-sm">
                  <SelectValue placeholder={locale === 'ta' ? 'அனைத்து அமைப்பு அலகுகள்' : 'All Org Units'}>
                    {activeUnionObj ? getOrgUnitName(activeUnionObj, locale) : (locale === 'ta' ? 'அனைத்து அமைப்பு அலகுகள்' : 'All Org Units')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">
                    {locale === 'ta' ? 'அனைத்து அமைப்பு அலகுகள்' : 'All Org Units'}
                  </SelectItem>
                  {unions?.map((u: any) => (
                    <SelectItem
                      key={String(u.id || u._id)}
                      value={String(u.id || u._id)}
                    >
                      {getOrgUnitName(u, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Panchayat / Ward */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{locale === 'ta' ? 'ஊராட்சி / வார்டு' : 'Panchayat / Ward'}</span>
              </Label>
              <Select
                value={filterPanchayatId || 'all'}
                onValueChange={(v) => onPanchayatChange(v === 'all' ? '' : v || '')}
              >
                <SelectTrigger className="w-full !h-10 sm:!h-11 bg-background border-primary/20 hover:border-primary/40 transition-colors rounded-xl shadow-xs text-xs sm:text-sm">
                  <SelectValue placeholder={locale === 'ta' ? 'அனைத்து ஊராட்சிகள்' : 'All Panchayats'}>
                    {activePanchayatObj
                      ? locale === 'ta' && activePanchayatObj.nameTa
                        ? `${activePanchayatObj.nameTa} (${activePanchayatObj.name})`
                        : activePanchayatObj.name
                      : locale === 'ta'
                      ? 'அனைத்து ஊராட்சிகள்'
                      : 'All Panchayats'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">
                    {locale === 'ta' ? 'அனைத்து ஊராட்சிகள்' : 'All Panchayats'}
                  </SelectItem>
                  {panchayats?.map((p: any) => {
                    const label =
                      locale === 'ta' && p.nameTa
                        ? `${p.nameTa} (${p.name})`
                        : p.name;
                    return (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Village / Locality */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{locale === 'ta' ? 'கிராமம் / குடியிருப்பு' : 'Village / Locality'}</span>
              </Label>
              <Select
                value={filterVillageId || 'all'}
                onValueChange={(v) => onVillageChange(v === 'all' ? '' : v || '')}
              >
                <SelectTrigger className="w-full !h-10 sm:!h-11 bg-background border-primary/20 hover:border-primary/40 transition-colors rounded-xl shadow-xs text-xs sm:text-sm">
                  <SelectValue placeholder={locale === 'ta' ? 'அனைத்து கிராமங்கள்' : 'All Villages'}>
                    {activeVillageObj
                      ? locale === 'ta' && activeVillageObj.nameTa
                        ? `${activeVillageObj.nameTa} (${activeVillageObj.name})`
                        : activeVillageObj.name
                      : locale === 'ta'
                      ? 'அனைத்து கிராமங்கள்'
                      : 'All Villages'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">
                    {locale === 'ta' ? 'அனைத்து கிராமங்கள்' : 'All Villages'}
                  </SelectItem>
                  {villages?.map((v: any) => {
                    const label =
                      locale === 'ta' && v.nameTa
                        ? `${v.nameTa} (${v.name})`
                        : v.name;
                    return (
                      <SelectItem key={String(v.id)} value={String(v.id)}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Agent Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Agent Status</span>
              </Label>
              <div className="flex p-1 bg-muted/40 dark:bg-muted/20 rounded-xl border border-primary/10 shadow-inner h-10 sm:h-11 items-center">
                <button
                  type="button"
                  onClick={() => onAgentStatusChange('')}
                  className={`flex-1 text-[11px] sm:text-xs font-semibold py-1.5 px-2 rounded-lg transition-all duration-200 truncate cursor-pointer ${
                    !filterAgentId
                      ? 'bg-white dark:bg-zinc-800 text-primary shadow-xs ring-1 ring-black/5'
                      : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => onAgentStatusChange('ASSIGNED')}
                  className={`flex-1 text-[11px] sm:text-xs font-semibold py-1.5 px-2 rounded-lg transition-all duration-200 truncate cursor-pointer ${
                    filterAgentId === 'ASSIGNED'
                      ? 'bg-emerald-500 text-white shadow-xs ring-1 ring-black/5'
                      : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Assigned
                </button>
                <button
                  type="button"
                  onClick={() => onAgentStatusChange('UNASSIGNED')}
                  className={`flex-1 text-[11px] sm:text-xs font-semibold py-1.5 px-2 rounded-lg transition-all duration-200 truncate cursor-pointer ${
                    filterAgentId === 'UNASSIGNED'
                      ? 'bg-rose-500 text-white shadow-xs ring-1 ring-black/5'
                      : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Unassigned
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Pills (Dismissable) */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-primary/10">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {locale === 'ta' ? 'செயலில் உள்ளவை:' : 'Active:'}
              </span>

              {activeUnionObj && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  <Building2 className="w-3 h-3" />
                  <span>{getOrgUnitName(activeUnionObj, locale)}</span>
                  <button
                    type="button"
                    onClick={() => onUnionChange('')}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
                    title={locale === 'ta' ? 'நீக்கு' : 'Remove'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activePanchayatObj && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <Store className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {locale === 'ta' && activePanchayatObj.nameTa
                      ? activePanchayatObj.nameTa
                      : activePanchayatObj.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPanchayatChange('')}
                    className="hover:bg-emerald-500/20 rounded-full p-0.5 transition-colors cursor-pointer"
                    title={locale === 'ta' ? 'நீக்கு' : 'Remove'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeVillageObj && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>
                    {locale === 'ta' && activeVillageObj.nameTa
                      ? activeVillageObj.nameTa
                      : activeVillageObj.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onVillageChange('')}
                    className="hover:bg-blue-500/20 rounded-full p-0.5 transition-colors cursor-pointer"
                    title={locale === 'ta' ? 'நீக்கு' : 'Remove'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterAgentId && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  <Users className="w-3 h-3" />
                  <span>
                    {filterAgentId === 'ASSIGNED' ? 'Agent Assigned' : 'Agent Unassigned'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAgentStatusChange('')}
                    className="hover:bg-purple-500/20 rounded-full p-0.5 transition-colors cursor-pointer"
                    title={locale === 'ta' ? 'நீக்கு' : 'Remove'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const BoothsFilters = React.memo(BoothsFiltersComponent);
