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
  LayoutGrid,
  List,
  Building2,
  Store,
  MapPin,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getOrgUnitName } from '@/lib/org-unit-translations';

export interface KilaisFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isAdvancedOpen: boolean;
  onToggleAdvanced: () => void;

  selectedUnion: string;
  onUnionChange: (val: string) => void;
  unions: any[] | undefined;

  selectedPanchayat: string;
  onPanchayatChange: (val: string) => void;
  panchayats: any[] | undefined;

  selectedVillage: string;
  onVillageChange: (val: string) => void;
  villages: any[] | undefined;

  onClearFilters: () => void;

  viewMode: 'table' | 'tile';
  onViewModeChange: (mode: 'table' | 'tile') => void;

  totalResults: number;
}

export function KilaisFilters({
  searchQuery,
  onSearchChange,
  isAdvancedOpen,
  onToggleAdvanced,
  selectedUnion,
  onUnionChange,
  unions,
  selectedPanchayat,
  onPanchayatChange,
  panchayats,
  selectedVillage,
  onVillageChange,
  villages,
  onClearFilters,
  viewMode,
  onViewModeChange,
  totalResults,
}: KilaisFiltersProps) {
  const locale = useLocale();
  const t = useTranslations('Kilais');

  // Local immediate search input state to prevent typing latency
  const [localSearch, setLocalSearch] = React.useState(searchQuery);

  React.useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    if (localSearch === searchQuery) return;
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  const activeUnionObj = React.useMemo(() => {
    if (!selectedUnion || selectedUnion === 'all') return null;
    return unions?.find(
      (u: any) => String(u.id || u._id) === String(selectedUnion)
    );
  }, [unions, selectedUnion]);

  const activePanchayatObj = React.useMemo(() => {
    if (!selectedPanchayat || selectedPanchayat === 'all') return null;
    return panchayats?.find(
      (p: any) => String(p.id) === String(selectedPanchayat)
    );
  }, [panchayats, selectedPanchayat]);

  const activeVillageObj = React.useMemo(() => {
    if (!selectedVillage || selectedVillage === 'all') return null;
    return villages?.find(
      (v: any) => String(v.id) === String(selectedVillage)
    );
  }, [villages, selectedVillage]);

  // Count active filters (Union, Panchayat, Village)
  const activeFiltersCount = [
    selectedUnion && selectedUnion !== 'all',
    selectedPanchayat && selectedPanchayat !== 'all',
    selectedVillage && selectedVillage !== 'all',
  ].filter(Boolean).length;

  const hasAnyFilter = activeFiltersCount > 0 || Boolean(searchQuery);

  return (
    <div className="flex flex-col bg-card p-3 sm:p-4 rounded-xl shadow-sm border border-primary/10 gap-3 sm:gap-4 transition-all">
      {/* Top Controls Row */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between w-full">
        {/* Left: Search Bar & Advanced Search Toggle Button */}
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
                title={locale === 'ta' ? 'தேடலை அழிக்கவும்' : 'Clear search'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Advanced Search Toggle Button */}
          <Button
            variant={isAdvancedOpen || activeFiltersCount > 0 ? 'default' : 'outline'}
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

        {/* Right: View Mode Toggle & Total Results */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between sm:justify-end shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">
            {totalResults}{' '}
            {locale === 'ta'
              ? totalResults === 1
                ? 'கிளை'
                : 'கிளைகள்'
              : totalResults === 1
              ? 'Kilai'
              : 'Kilais'}
          </span>

          <div className="flex bg-muted/40 p-1 rounded-xl border border-primary/10 shadow-inner h-10 sm:h-11 items-center shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`h-full px-2.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-background shadow-xs text-primary ring-1 ring-black/5'
                  : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={locale === 'ta' ? 'பட்டியல் காட்சி' : 'Table View'}
            >
              <List className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('tile')}
              className={`h-full px-2.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                viewMode === 'tile'
                  ? 'bg-background shadow-xs text-primary ring-1 ring-black/5'
                  : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={locale === 'ta' ? 'கட்டக் காட்சி' : 'Tile View'}
            >
              <LayoutGrid className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search Panel (Collapsible) */}
      {isAdvancedOpen && (
        <div className="mt-1 bg-zinc-50/70 dark:bg-zinc-900/60 p-4 sm:p-5 rounded-xl border border-primary/10 shadow-xs animate-in slide-in-from-top-2 fade-in duration-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
              <Filter className="w-4 h-4" />
              <span>
                {locale === 'ta' ? 'மேம்பட்ட வடிப்பான்கள்' : 'Advanced Filters'}
              </span>
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
                {locale === 'ta' ? 'அனைத்தையும் நீக்கு' : 'Clear Filters'}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Org Unit Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>{locale === 'ta' ? 'அமைப்பு அலகு (ஒன்றியம்)' : 'Org Unit (Union)'}</span>
              </Label>
              <Select
                value={selectedUnion || 'all'}
                onValueChange={(val) => onUnionChange(val || 'all')}
              >
                <SelectTrigger className="w-full h-10 sm:h-11 bg-background border-primary/20 text-xs sm:text-sm rounded-xl">
                  <SelectValue placeholder={locale === 'ta' ? 'அனைத்து அமைப்பு அலகுகள்' : 'All Org Units'}>
                    {activeUnionObj ? getOrgUnitName(activeUnionObj, locale) : (locale === 'ta' ? 'அனைத்து அமைப்பு அலகுகள்' : 'All Org Units')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">
                    {locale === 'ta' ? 'அனைத்து அமைப்பு அலகுகள்' : 'All Org Units'}
                  </SelectItem>
                  {unions?.map((u: any) => (
                    <SelectItem key={u.id || u._id} value={String(u.id || u._id)}>
                      {getOrgUnitName(u, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Panchayat Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{locale === 'ta' ? 'ஊராட்சி / வார்டு' : 'Panchayat / Ward'}</span>
              </Label>
              <Select
                value={selectedPanchayat || 'all'}
                onValueChange={(val) => onPanchayatChange(val || 'all')}
              >
                <SelectTrigger className="w-full h-10 sm:h-11 bg-background border-primary/20 text-xs sm:text-sm rounded-xl">
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
                      <SelectItem key={p.id} value={String(p.id)}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Village Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{locale === 'ta' ? 'கிராமம் / குடியிருப்பு' : 'Village / Locality'}</span>
              </Label>
              <Select
                value={selectedVillage || 'all'}
                onValueChange={(val) => onVillageChange(val || 'all')}
              >
                <SelectTrigger className="w-full h-10 sm:h-11 bg-background border-primary/20 text-xs sm:text-sm rounded-xl">
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
                      <SelectItem key={v.id} value={String(v.id)}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
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
                    onClick={() => onUnionChange('all')}
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
                    onClick={() => onPanchayatChange('all')}
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
                    onClick={() => onVillageChange('all')}
                    className="hover:bg-blue-500/20 rounded-full p-0.5 transition-colors cursor-pointer"
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

