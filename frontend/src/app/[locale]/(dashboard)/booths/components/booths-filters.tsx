'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export interface BoothsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  isAdvancedOpen: boolean;
  onToggleAdvanced: () => void;
  filterUnionId: string;
  onUnionChange: (val: string) => void;
  filterKilaiId: string;
  onKilaiChange: (val: string) => void;
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
  kilais: any[] | undefined;
  dataSectionRef?: React.RefObject<HTMLDivElement | null>;
}

export function BoothsFiltersComponent({
  search,
  onSearchChange,
  isAdvancedOpen,
  onToggleAdvanced,
  filterUnionId,
  onUnionChange,
  filterKilaiId,
  onKilaiChange,
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
  kilais,
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
              isAdvancedOpen || filterUnionId || filterKilaiId || filterAgentId
                ? 'default'
                : 'outline'
            }
            className={`h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl gap-2 border-primary/20 transition-all font-semibold text-xs sm:text-sm shrink-0 justify-center w-full sm:w-auto cursor-pointer ${
              isAdvancedOpen || filterUnionId || filterKilaiId || filterAgentId
                ? 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/30'
                : 'text-muted-foreground hover:text-primary'
            }`}
            onClick={onToggleAdvanced}
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Search</span>
            {(filterUnionId || filterKilaiId || filterAgentId) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                {[filterUnionId, filterKilaiId, filterAgentId].filter(Boolean).length}
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
        <div className="mt-2 bg-white dark:bg-zinc-900/60 p-4 sm:p-5 rounded-xl border border-primary/10 shadow-xs animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
              <Filter className="w-4 h-4" />
              <span>Advanced Filters</span>
            </div>

            {(filterUnionId || filterKilaiId || filterAgentId) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 sm:h-8 text-xs font-semibold text-destructive hover:text-destructive bg-destructive/10 hover:bg-destructive/20 px-3 rounded-lg cursor-pointer transition-colors"
                onClick={onClearFilters}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Org Unit
              </Label>
              <Select
                value={filterUnionId}
                onValueChange={(v) => onUnionChange(v === 'all' ? '' : v || '')}
              >
                <SelectTrigger className="w-full !h-10 sm:!h-11 bg-background border-primary/20 hover:border-primary/40 transition-colors rounded-xl shadow-xs text-xs sm:text-sm">
                  <SelectValue placeholder="All Org Units">
                    {filterUnionId && filterUnionId !== 'all'
                      ? unions?.find((u: any) => String(u.id || u._id) === filterUnionId)?.name
                      : 'All Org Units'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Org Units">
                    All Org Units
                  </SelectItem>
                  {unions?.map((u: any) => (
                    <SelectItem
                      key={String(u.id || u._id)}
                      value={String(u.id || u._id)}
                      label={u.name}
                    >
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Kilai
              </Label>
              <Select
                value={filterKilaiId}
                onValueChange={(v) => onKilaiChange(v === 'all' ? '' : v || '')}
                disabled={!filterUnionId}
              >
                <SelectTrigger className="w-full !h-10 sm:!h-11 bg-background border-primary/20 hover:border-primary/40 transition-colors rounded-xl shadow-xs text-xs sm:text-sm disabled:opacity-50">
                  <SelectValue placeholder="All Kilais">
                    {filterKilaiId && filterKilaiId !== 'all'
                      ? kilais?.find((k: any) => String(k.id || k._id) === filterKilaiId)?.name
                      : 'All Kilais'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Kilais">
                    All Kilais
                  </SelectItem>
                  {kilais
                    ?.filter((k: any) => String(k.unionId) === filterUnionId)
                    .map((k: any) => (
                      <SelectItem
                        key={String(k.id || k._id)}
                        value={String(k.id || k._id)}
                        label={k.name}
                      >
                        {k.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Agent Status
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
        </div>
      )}
    </div>
  );
}

export const BoothsFilters = React.memo(BoothsFiltersComponent);

