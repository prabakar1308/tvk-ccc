'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  Building2,
  Users,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Phone,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { translatePersonNameToTamil } from '@/lib/name-translations';
import { cn } from '@/lib/utils';

export interface BoothsSectionProps {
  booths?: any[];
  panchayatBooths?: any[]; // for backward compatibility
  title?: string;
  subtitle?: string;
  showAssignedKilai?: boolean; // Defaults to true on panchayat, false on village
  areaNameEn?: string;
  areaNameTa?: string;
  unionId?: string;
  panchayatId?: string;
  villageId?: string;
  locale: string;
}

export function BoothsSection({
  booths,
  panchayatBooths,
  title,
  subtitle,
  showAssignedKilai = true,
  areaNameEn,
  areaNameTa,
  unionId,
  panchayatId,
  villageId,
  locale,
}: BoothsSectionProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'table' | 'tile'>('table');
  const [expandedBoothIds, setExpandedBoothIds] = useState<Record<string, boolean>>({});
  const [callConfirmation, setCallConfirmation] = useState<{ name: string; phone: string } | null>(null);

  const handleGoToBooths = () => {
    const params = new URLSearchParams();
    if (unionId) params.append('union', unionId);
    if (panchayatId) params.append('panchayat', panchayatId);
    if (villageId) params.append('village', villageId);
    const qs = params.toString();
    router.push(qs ? `/booths?${qs}` : '/booths');
  };

  // Default to Tile view on mobile (< 768px), Table view on desktop
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('tile');
    }
  }, []);

  const rawBooths = booths || panchayatBooths || [];

  // Sort booths by booth number ascending
  const sortedBooths = useMemo(() => {
    return [...rawBooths].sort((a: any, b: any) => {
      const numA = parseInt(String(a.boothNo || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.boothNo || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return String(a.boothNo || '').localeCompare(String(b.boothNo || ''));
    });
  }, [rawBooths]);

  // Toggle single booth expansion
  const toggleExpand = (boothKey: string) => {
    setExpandedBoothIds((prev) => ({
      ...prev,
      [boothKey]: !prev[boothKey],
    }));
  };

  // Check if all booths are currently expanded
  const allExpanded = useMemo(() => {
    if (sortedBooths.length === 0) return false;
    return sortedBooths.every((b: any, idx: number) => {
      const key = String(b.id || b.boothNo || idx);
      return Boolean(expandedBoothIds[key]);
    });
  }, [sortedBooths, expandedBoothIds]);

  // Master toggle all booths
  const toggleAllExpanded = () => {
    const nextState = !allExpanded;
    const nextMap: Record<string, boolean> = {};
    sortedBooths.forEach((b: any, idx: number) => {
      const key = String(b.id || b.boothNo || idx);
      nextMap[key] = nextState;
    });
    setExpandedBoothIds(nextMap);
  };

  const sectionTitle =
    title ||
    (locale === 'ta' ? 'வாக்குச்சாவடிகள்' : 'Covered Polling Booths');

  const sectionSubtitle =
    subtitle ||
    (locale === 'ta'
      ? 'ஊராட்சி வரம்பிற்குள் வரும் அதிகாரப்பூர்வ தேர்தல் வாக்குச்சாவடிகள் மற்றும் வாக்காளர் விவரங்கள்'
      : 'Official polling stations and voter demographics mapped under this jurisdiction');

  // Total column span for the nested drawer row (includes Recent Result column)
  const tableColSpan = showAssignedKilai ? 8 : 7;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {sectionTitle}
              </h2>
              <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 text-xs font-bold">
                {sortedBooths.length} {locale === 'ta' ? 'சாவடிகள்' : 'Booths'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sectionSubtitle}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Master Expand / Collapse Button in Table View */}
          {viewMode === 'table' && sortedBooths.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllExpanded}
              className="h-8 text-xs font-semibold text-orange-800 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/40 flex items-center gap-1.5 shadow-2xs"
              title={
                allExpanded
                  ? locale === 'ta'
                    ? 'அனைத்து சாவடிகளையும் சுருக்கு'
                    : 'Collapse All Booths'
                  : locale === 'ta'
                  ? 'அனைத்து சாவடிகளையும் விரி'
                  : 'Expand All Booths'
              }
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  <span>{locale === 'ta' ? 'அனைத்தையும் சுருக்கு' : 'Collapse All'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  <span>{locale === 'ta' ? 'அனைத்தையும் விரி' : 'Expand All'}</span>
                </>
              )}
            </Button>
          )}

          {/* View Mode Toggle */}
          {sortedBooths.length > 0 && (
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700/60 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={locale === 'ta' ? 'அட்டவணை காட்சி' : 'Table View'}
              >
                <List className="w-3.5 h-3.5" />
                <span>{locale === 'ta' ? 'அட்டவணை' : 'Table'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tile')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'tile'
                    ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={locale === 'ta' ? 'கட்டக் காட்சி' : 'Tile View'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{locale === 'ta' ? 'கட்டம்' : 'Tiles'}</span>
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToBooths}
            className="h-8 text-xs text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60 font-semibold hover:bg-orange-50 dark:hover:bg-orange-950/30"
          >
            {locale === 'ta' ? 'சாவடிகள் பட்டியல்' : 'All Booths'} →
          </Button>
        </div>
      </div>

      {sortedBooths.length === 0 ? (
        <div className="py-10 text-center space-y-2.5 border-2 border-dashed rounded-xl border-gray-200 dark:border-zinc-800 bg-gray-50/40 dark:bg-zinc-800/20">
          <Building2 className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
              {locale === 'ta' ? 'வாக்குச்சாவடிகள் எதுவும் இணைக்கப்படவில்லை' : 'No Polling Booth linked'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === 'ta'
                ? 'வாக்குச்சாவடிகள் மேலாண்மைப் பிரிவிலிருந்து சாவடிகளை இணைக்கலாம்.'
                : 'Polling booths can be mapped to this administrative area from the booths directory.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToBooths}
            className="mt-2 text-xs font-semibold"
          >
            {locale === 'ta' ? 'சாவடிகள் பட்டியலுக்குச் செல்லவும்' : 'Go to Booth Directory'}
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View with Expandable Rows */
        <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <Table className="w-full">
              <TableHeader className="bg-gray-50/80 dark:bg-zinc-800/50">
                <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-zinc-800">
                  <TableHead className="w-14 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 py-3.5">
                    #
                  </TableHead>
                  <TableHead className="w-24 text-center text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                    {locale === 'ta' ? 'சாவடி எண்' : 'Booth No'}
                  </TableHead>
                  <TableHead className="min-w-[200px] text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                    {locale === 'ta' ? 'வாக்குச்சாவடி / பள்ளி' : 'Polling Station / Name'}
                  </TableHead>

                  {/* Assigned Kilai Column (Panchayat Page only) */}
                  {showAssignedKilai && (
                    <TableHead className="w-[18%] min-w-[140px] text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                      {locale === 'ta' ? 'இணைக்கப்பட்ட கிளைகள்' : 'Assigned Kilais'}
                    </TableHead>
                  )}

                  <TableHead className="w-[18%] min-w-[130px] text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                    {locale === 'ta' ? 'சாவடி முகவர்கள்' : 'Booth Agents'}
                  </TableHead>
                  <TableHead className="w-24 text-center text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                    {locale === 'ta' ? 'வாக்காளர்கள்' : 'Voters'}
                  </TableHead>
                  <TableHead className="w-32 text-center text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                    {locale === 'ta' ? 'சமீபத்திய முடிவு' : 'Recent Result'}
                  </TableHead>
                  <TableHead className="w-20 text-right text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5 pr-4">
                    {locale === 'ta' ? 'செயல்' : 'Action'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBooths.map((booth: any, idx: number) => {
                  const boothKey = String(booth.id || booth.boothNo || idx);
                  const boothNumber = booth.boothNo || idx + 1;
                  const boothName = booth.name || `${locale === 'ta' ? 'சாவடி' : 'Booth'} ${boothNumber}`;

                  // Resolve all Assigned Kilais as a list
                  const kilaisList: { id?: string; name: string }[] = (() => {
                    const map = new Map<string, { id?: string; name: string }>();

                    if (Array.isArray(booth.kilais) && booth.kilais.length > 0) {
                      booth.kilais.forEach((k: any, kIdx: number) => {
                        if (!k) return;
                        const id = k.id || `k-${kIdx}`;
                        const name =
                          locale === 'ta' && (k.translations?.ta?.name || k.tamilName)
                            ? k.translations?.ta?.name || k.tamilName
                            : k.name || (typeof k === 'string' ? k : '');
                        if (name) {
                          map.set(name, { id, name });
                        }
                      });
                    }

                    if (Array.isArray(booth.linkedKilais) && booth.linkedKilais.length > 0) {
                      booth.linkedKilais.forEach((k: any, kIdx: number) => {
                        if (!k) return;
                        if (typeof k === 'string') {
                          map.set(k, { name: k });
                        } else {
                          const id = k.id || `lk-${kIdx}`;
                          const name =
                            locale === 'ta' && (k.translations?.ta?.name || k.tamilName)
                              ? k.translations?.ta?.name || k.tamilName
                              : k.name || '';
                          if (name) {
                            map.set(name, { id, name });
                          }
                        }
                      });
                    }

                    if (map.size === 0 && (booth.kilaiName || booth.kilaiTamilName)) {
                      const name =
                        locale === 'ta' && booth.kilaiTamilName
                          ? booth.kilaiTamilName
                          : booth.kilaiName || '';
                      if (name) {
                        map.set(name, { id: booth.kilaiId, name });
                      }
                    }

                    return Array.from(map.values());
                  })();

                  const isExpanded = Boolean(expandedBoothIds[boothKey]);

                  // Demographics breakdown
                  const totalCount = booth.totalCount || booth.totalVoters || 0;
                  const maleCount = booth.maleCount || 0;
                  const femaleCount = booth.femaleCount || 0;
                  const thirdCount = booth.thirdGenderCount || 0;
                  const malePct = totalCount > 0 ? Math.round((maleCount / totalCount) * 100) : 0;
                  const femalePct = totalCount > 0 ? Math.round((femaleCount / totalCount) * 100) : 0;
                  const thirdPct = totalCount > 0 && thirdCount > 0 ? Math.round((thirdCount / totalCount) * 100) : 0;

                  const agentsList = booth.agents || [];
                  const agentsCount = agentsList.length > 0 ? agentsList.length : (booth._count?.agents || 0);
                  const recentElection =
                    booth.electionResults && booth.electionResults.length > 0
                      ? booth.electionResults[0]
                      : null;

                  return (
                    <React.Fragment key={boothKey}>
                      {/* Main Table Row */}
                      <TableRow
                        onClick={() => toggleExpand(boothKey)}
                        className={`group cursor-pointer transition-colors border-b select-none ${
                          isExpanded
                            ? 'bg-orange-50/40 dark:bg-zinc-800/70 border-orange-200/60 dark:border-zinc-700'
                            : 'hover:bg-orange-50/25 dark:hover:bg-orange-950/20 border-gray-100 dark:border-zinc-800/80'
                        }`}
                      >
                        {/* # and Expand Chevron */}
                        <TableCell className="text-center py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-xs font-bold text-muted-foreground w-4">
                              {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(boothKey);
                              }}
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                isExpanded
                                  ? 'bg-slate-600 text-white shadow-2xs rotate-180 hover:bg-slate-700'
                                  : 'bg-slate-50 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300 hover:bg-slate-100 hover:scale-105 border border-slate-200/60 dark:border-slate-800/60'
                              }`}
                              title={
                                isExpanded
                                  ? locale === 'ta'
                                    ? 'சுருக்கு'
                                    : 'Collapse'
                                  : locale === 'ta'
                                  ? 'விரி'
                                  : 'Expand'
                              }
                            >
                              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
                            </button>
                          </div>
                        </TableCell>

                        {/* Booth No Badge */}
                        <TableCell className="py-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-bold text-xs bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 font-mono shadow-2xs">
                            #{boothNumber}
                          </span>
                        </TableCell>

                        {/* Polling Station Name & Area */}
                        <TableCell className="py-3">
                          <div className="flex flex-col max-w-[340px]">
                            <span
                              className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors line-clamp-2 leading-snug"
                              title={boothName}
                            >
                              {boothName}
                            </span>
                            {booth.area && (
                              <span
                                className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate"
                                title={booth.area}
                              >
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span>{booth.area}</span>
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Assigned Kilais (Only in Panchayat page) */}
                        {showAssignedKilai && (
                          <TableCell className="py-3 text-xs text-gray-800 dark:text-zinc-200 font-medium">
                            {kilaisList.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[240px]">
                                {kilaisList.map((k, kIdx) => (
                                  <span
                                    key={k.id || `${k.name}-${kIdx}`}
                                    className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md text-[11px] font-medium"
                                  >
                                    {k.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">-</span>
                            )}
                          </TableCell>
                        )}

                        {/* Booth Agents */}
                        <TableCell className="py-3">
                          {agentsList.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {agentsList.slice(0, 2).map((agent: any) => {
                                const aName =
                                  locale === 'ta'
                                    ? translatePersonNameToTamil(agent.name) || agent.name
                                    : agent.name;
                                return (
                                  <span
                                    key={agent.id || agent.name}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                                  >
                                    <Users className="w-2.5 h-2.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                    <span className="truncate max-w-[110px]">{aName}</span>
                                  </span>
                                );
                              })}
                              {agentsList.length > 2 && (
                                <span className="text-[10px] font-bold text-muted-foreground px-1 py-0.5">
                                  +{agentsList.length - 2}
                                </span>
                              )}
                            </div>
                          ) : agentsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200">
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              <span>{agentsCount} {locale === 'ta' ? 'முகவர்கள்' : 'Agents'}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              {locale === 'ta' ? 'நியமிக்கப்படவில்லை' : 'None assigned'}
                            </span>
                          )}
                        </TableCell>

                        {/* Total Voters */}
                        <TableCell className="py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 font-mono shadow-2xs">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            {totalCount.toLocaleString()}
                          </span>
                        </TableCell>

                        {/* Recent Result Column */}
                        <TableCell className="py-3 text-center">
                          {(() => {
                            if (!recentElection) {
                              return (
                                <span className="text-xs text-muted-foreground italic font-mono">—</span>
                              );
                            }

                            const isTVKLead =
                              recentElection.winnerPartyName === 'TVK' ||
                              recentElection.tvkVotes > (recentElection.topParty1Votes || 0);

                            return (
                              <div className="inline-flex flex-col items-center justify-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-xs sm:text-sm text-[#8F0A1B] dark:text-red-400">
                                    {recentElection.tvkVotes?.toLocaleString()}
                                  </span>
                                  <span
                                    className={cn(
                                      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-extrabold shadow-2xs border',
                                      isTVKLead
                                        ? 'bg-[#FFC72C]/25 text-[#8F0A1B] border-amber-400/50'
                                        : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200'
                                    )}
                                  >
                                    {recentElection.tvkPercentage}%
                                  </span>
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[120px] block mt-0.5">
                                  {recentElection.electionYear ? `${recentElection.electionYear}` : ''}{' '}
                                  {recentElection.electionName
                                    ? `• ${recentElection.electionName.replace(/\d{4}\s*/, '')}`
                                    : ''}
                                </span>
                              </div>
                            );
                          })()}
                        </TableCell>

                        {/* Action Column */}
                        <TableCell className="py-3 text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(boothKey);
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border transition-all ${
                                isExpanded
                                  ? 'bg-slate-600 text-white border-slate-600 shadow-2xs'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800/60'
                              }`}
                              title={
                                isExpanded
                                  ? locale === 'ta'
                                    ? 'சுருக்கு'
                                    : 'Collapse'
                                  : locale === 'ta'
                                  ? 'விவரம்'
                                  : 'Details'
                              }
                            >
                              <span>{isExpanded ? (locale === 'ta' ? 'சுருக்கு' : 'Close') : (locale === 'ta' ? 'விவரம்' : 'Details')}</span>
                              <ChevronDown
                                className={`w-3 h-3 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-white' : 'text-slate-600 dark:text-slate-400'
                                }`}
                              />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Drawer: Full Booth Name, Voter Demographics, Agents Roster */}
                      {isExpanded && (
                        <TableRow className="bg-[#f3f3ed] hover:bg-[#f3f3ed] dark:bg-zinc-850/60 dark:hover:bg-zinc-850/60 border-b border-slate-200/50 dark:border-zinc-700/60">
                          <TableCell colSpan={tableColSpan} className="p-0">
                            <div className="w-full max-w-full min-w-0 border-l-4 border-l-primary bg-[#f3f3ed] dark:bg-zinc-900/95 p-3.5 sm:p-5 md:p-6 space-y-4 overflow-hidden">
                              {/* Drawer Header: Station Name & Direct Link */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                                <div className="space-y-1.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <span className="bg-slate-600 text-white text-xs font-bold font-mono px-2.5 py-0.5 rounded-md shadow-2xs shrink-0">
                                      #{boothNumber}
                                    </span>
                                    {booth.area && (
                                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded shrink-0">
                                        <MapPin className="w-3 h-3 text-muted-foreground" />
                                        <span>{booth.area}</span>
                                      </span>
                                    )}
                                    {showAssignedKilai && kilaisList.length > 0 && (
                                      <div className="flex items-center gap-1 flex-wrap shrink-0">
                                        {kilaisList.map((k, kIdx) => (
                                          <span
                                            key={k.id || `${k.name}-${kIdx}`}
                                            className="text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-medium shrink-0"
                                          >
                                            {locale === 'ta' ? 'கிளை: ' : 'Kilai: '}
                                            {k.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug break-words">
                                    {boothName}
                                  </h3>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                  {/* <Link
                                    href={`/booths?search=${boothNumber}`}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 dark:text-orange-400 hover:underline px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-900/50 shrink-0"
                                  >
                                    <span>{locale === 'ta' ? 'சாவடி விவரம்' : 'Full Booth Directory'}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link> */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpand(boothKey);
                                    }}
                                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1 shrink-0 px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
                                  >
                                    <span>{locale === 'ta' ? 'சுருக்கு' : 'Collapse'}</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Demographic Matrix & Ratio Visual */}
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-gray-800 dark:text-zinc-200">
                                  <span className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-orange-600" />
                                    <span>{locale === 'ta' ? 'வாக்காளர் புள்ளிவிவரங்கள்' : 'Electoral Demographics'}</span>
                                  </span>
                                  <span className="text-[11px] font-mono text-muted-foreground">
                                    {locale === 'ta' ? 'மொத்தம்:' : 'Total:'}{' '}
                                    <span className="font-bold text-gray-900 dark:text-white">{totalCount.toLocaleString()}</span>
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
                                  {/* Male Voters Card */}
                                  <div className="p-2.5 sm:p-3 rounded-xl bg-blue-100/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 truncate">
                                        {locale === 'ta' ? 'ஆண்கள்' : 'Male'}
                                      </span>
                                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                        {malePct}%
                                      </span>
                                    </div>
                                    <p className="text-base sm:text-lg font-extrabold font-mono text-gray-900 dark:text-white mt-1">
                                      {maleCount.toLocaleString()}
                                    </p>
                                  </div>

                                  {/* Female Voters Card */}
                                  <div className="p-2.5 sm:p-3 rounded-xl bg-pink-100/50 dark:bg-pink-950/20 border border-pink-200/60 dark:border-pink-900/40">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[11px] font-semibold text-pink-700 dark:text-pink-300 truncate">
                                        {locale === 'ta' ? 'பெண்கள்' : 'Female'}
                                      </span>
                                      <span className="text-[10px] font-mono font-bold text-pink-600 dark:text-pink-400 shrink-0">
                                        {femalePct}%
                                      </span>
                                    </div>
                                    <p className="text-base sm:text-lg font-extrabold font-mono text-gray-900 dark:text-white mt-1">
                                      {femaleCount.toLocaleString()}
                                    </p>
                                  </div>

                                  {/* Third Gender Card */}
                                  <div className="p-2.5 sm:p-3 rounded-xl bg-purple-100/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 truncate" title={locale === 'ta' ? 'மூன்றாம் பாலினம்' : 'Other'}>
                                        {locale === 'ta' ? 'மூன்றாம்' : 'Other'}
                                      </span>
                                      <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 shrink-0">
                                        {thirdPct}%
                                      </span>
                                    </div>
                                    <p className="text-base sm:text-lg font-extrabold font-mono text-gray-900 dark:text-white mt-1">
                                      {thirdCount.toLocaleString()}
                                    </p>
                                  </div>

                                  {/* Total Card */}
                                  <div className="p-2.5 sm:p-3 rounded-xl bg-orange-100/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/60">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300 truncate">
                                        {locale === 'ta' ? 'மொத்தம்' : 'Total'}
                                      </span>
                                      <span className="text-[10px] font-mono font-bold text-orange-700 dark:text-orange-400 shrink-0">
                                        100%
                                      </span>
                                    </div>
                                    <p className="text-base sm:text-lg font-extrabold font-mono text-orange-900 dark:text-orange-100 mt-1">
                                      {totalCount.toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {/* Gender Distribution Progress Bar */}
                                {totalCount > 0 && (
                                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-zinc-800 flex overflow-hidden">
                                    <div
                                      style={{ width: `${malePct}%` }}
                                      className="bg-blue-500 h-full"
                                      title={`Male: ${malePct}%`}
                                    />
                                    <div
                                      style={{ width: `${femalePct}%` }}
                                      className="bg-pink-500 h-full"
                                      title={`Female: ${femalePct}%`}
                                    />
                                    {thirdCount > 0 && (
                                      <div
                                        style={{ width: `${thirdPct}%` }}
                                        className="bg-purple-500 h-full"
                                        title={`Other: ${thirdPct}%`}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Booth Agents Section in Drawer */}
                              <div className="pt-2 border-t border-orange-100 dark:border-zinc-800 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                                    <span>
                                      {locale === 'ta'
                                        ? 'கள வாக்குச்சாவடி முகவர்கள்'
                                        : 'Assigned Polling Booth Agents'}
                                    </span>
                                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-200 border-orange-200 text-[10px] font-bold px-2 py-0 shrink-0">
                                      {agentsCount} {locale === 'ta' ? 'முகவர்கள்' : 'Agents'}
                                    </Badge>
                                  </h4>
                                </div>

                                {agentsList.length > 0 ? (
                                  <div className="grid gap-2 sm:gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {agentsList.map((agent: any) => {
                                      const agentName =
                                        locale === 'ta'
                                          ? translatePersonNameToTamil(agent.name) || agent.name
                                          : agent.name;
                                      return (
                                        <div
                                          key={agent.id || agent.name}
                                          className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/80 shadow-2xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-7 h-7 rounded-full bg-red-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                              {agent.name?.charAt(0) || 'A'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                                                {agentName}
                                              </p>
                                              <p className="text-[10px] text-muted-foreground truncate">
                                                {agent.designation ||
                                                  agent.role ||
                                                  (locale === 'ta' ? 'சாவடி முகவர்' : 'Booth Agent')}
                                              </p>
                                            </div>
                                          </div>

                                          {agent.phone && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCallConfirmation({
                                                  name: agentName,
                                                  phone: agent.phone,
                                                });
                                              }}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono font-bold hover:bg-emerald-100 transition-colors shrink-0"
                                            >
                                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                                              <span>{agent.phone}</span>
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-800/40 border border-dashed border-gray-200 dark:border-zinc-700 text-center">
                                    <p className="text-xs text-muted-foreground">
                                      {locale === 'ta'
                                        ? 'இந்த வாக்குச்சாவடிக்கு முகவர்கள் இன்னும் நியமிக்கப்படவில்லை.'
                                        : 'No booth agents assigned to this station yet.'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Past Election Results Section in Drawer */}
                              <div className="pt-3 border-t border-orange-100 dark:border-zinc-800 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                      <span>
                                        {locale === 'ta'
                                          ? 'கடந்த தேர்தல் முடிவுகள்'
                                          : 'Past Election Results'}
                                      </span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                        {booth.electionResults?.length || 0}
                                      </span>
                                    </h4>
                                  </div>
                                </div>

                                {booth.electionResults && booth.electionResults.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {booth.electionResults.map((result: any) => {
                                      const isTVKWinner =
                                        result.winnerPartyName === 'TVK' ||
                                        result.tvkVotes > (result.topParty1Votes || 0);
                                      return (
                                        <div
                                          key={result.id || result.electionYear}
                                          className="p-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200/90 dark:border-zinc-750 shadow-2xs space-y-3"
                                        >
                                          {/* Header: Election Name & Year */}
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200">
                                                {result.electionYear}
                                              </span>
                                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                {result.electionName}
                                              </span>
                                            </div>
                                            {result.totalVotesPolled && (
                                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {locale === 'ta' ? 'பதிவான வாக்குகள்' : 'Total Votes Polled'}:{' '}
                                                <span className="font-semibold text-foreground">
                                                  {result.totalVotesPolled.toLocaleString()}
                                                </span>
                                              </p>
                                            )}
                                          </div>

                                          {/* TVK Vote Share Banner */}
                                          <div
                                            className={cn(
                                              'p-2.5 rounded-lg border flex items-center justify-between gap-2',
                                              isTVKWinner
                                                ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800/40'
                                                : 'bg-red-50/50 border-red-200/80 dark:bg-red-950/20 dark:border-red-900/40'
                                            )}
                                          >
                                            <div>
                                              <p className="text-[10px] font-bold text-[#8F0A1B] dark:text-red-400 uppercase tracking-wide">
                                                TVK {locale === 'ta' ? 'வாக்குகள்' : 'Votes'}
                                              </p>
                                              <p className="text-base font-extrabold text-[#8F0A1B] dark:text-red-300 font-mono">
                                                {result.tvkVotes?.toLocaleString() || 0}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <span
                                                className={cn(
                                                  'inline-block px-2 py-0.5 rounded text-xs font-extrabold font-mono',
                                                  isTVKWinner
                                                    ? 'bg-[#FFC72C] text-[#8F0A1B] shadow-2xs'
                                                    : 'bg-[#8F0A1B] text-white'
                                                )}
                                              >
                                                {result.tvkPercentage}%
                                              </span>
                                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {locale === 'ta' ? 'வாக்கு சதவீதம்' : 'Vote Share'}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Competitors Breakdown */}
                                          {(result.topParty1Name || result.topParty2Name) && (
                                            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-dashed border-gray-200 dark:border-zinc-700">
                                              {result.topParty1Name && (
                                                <div className="p-1.5 rounded bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-750">
                                                  <p className="text-[10px] text-muted-foreground truncate font-medium">
                                                    {result.topParty1Name}
                                                  </p>
                                                  <p className="font-bold font-mono text-gray-800 dark:text-zinc-200">
                                                    {result.topParty1Votes ? result.topParty1Votes.toLocaleString() : '—'}
                                                  </p>
                                                </div>
                                              )}
                                              {result.topParty2Name && (
                                                <div className="p-1.5 rounded bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-750">
                                                  <p className="text-[10px] text-muted-foreground truncate font-medium">
                                                    {result.topParty2Name}
                                                  </p>
                                                  <p className="font-bold font-mono text-gray-800 dark:text-zinc-200">
                                                    {result.topParty2Votes ? result.topParty2Votes.toLocaleString() : '—'}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Winner & Margin */}
                                          {(result.winnerPartyName || result.margin) && (
                                            <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground">
                                              {result.winnerPartyName && (
                                                <span className="truncate">
                                                  {locale === 'ta' ? 'வெற்றி' : 'Winner'}:{' '}
                                                  <span className="font-bold text-foreground">
                                                    {result.winnerPartyName}
                                                  </span>
                                                </span>
                                              )}
                                              {result.margin && (
                                                <span className="font-mono shrink-0">
                                                  {locale === 'ta' ? 'வித்தியாசம்' : 'Margin'}:{' '}
                                                  <span className="font-semibold text-foreground">
                                                    +{result.margin.toLocaleString()}
                                                  </span>
                                                </span>
                                              )}
                                            </div>
                                          )}

                                          {/* Notes if any */}
                                          {result.notes && (
                                            <p className="text-[11px] italic text-muted-foreground bg-gray-50 dark:bg-zinc-800 p-1.5 rounded border border-gray-100 dark:border-zinc-700">
                                              {result.notes}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-xl bg-white/60 dark:bg-zinc-800/40 border border-dashed border-gray-200 dark:border-zinc-700 text-center flex flex-col items-center justify-center gap-1.5">
                                    <Trophy className="w-5 h-5 text-muted-foreground/40" />
                                    <p className="text-xs text-muted-foreground">
                                      {locale === 'ta'
                                        ? 'தேர்தல் முடிவுகள் எதுவும் பதிவு செய்யப்படவில்லை.'
                                        : 'No past election results recorded for this booth.'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
        </div>
      ) : (
        /* Attractive Modern Tile View with Demographics */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBooths.map((booth: any, idx: number) => {
            const boothKey = String(booth.id || booth.boothNo || idx);
            const boothNumber = booth.boothNo || idx + 1;
            const boothName = booth.name || `${locale === 'ta' ? 'சாவடி' : 'Booth'} ${boothNumber}`;

            // Resolve all Assigned Kilais as a list
            const kilaisList: { id?: string; name: string }[] = (() => {
              const map = new Map<string, { id?: string; name: string }>();

              if (Array.isArray(booth.kilais) && booth.kilais.length > 0) {
                booth.kilais.forEach((k: any, kIdx: number) => {
                  if (!k) return;
                  const id = k.id || `k-${kIdx}`;
                  const name =
                    locale === 'ta' && (k.translations?.ta?.name || k.tamilName)
                      ? k.translations?.ta?.name || k.tamilName
                      : k.name || (typeof k === 'string' ? k : '');
                  if (name) {
                    map.set(name, { id, name });
                  }
                });
              }

              if (Array.isArray(booth.linkedKilais) && booth.linkedKilais.length > 0) {
                booth.linkedKilais.forEach((k: any, kIdx: number) => {
                  if (!k) return;
                  if (typeof k === 'string') {
                    map.set(k, { name: k });
                  } else {
                    const id = k.id || `lk-${kIdx}`;
                    const name =
                      locale === 'ta' && (k.translations?.ta?.name || k.tamilName)
                        ? k.translations?.ta?.name || k.tamilName
                        : k.name || '';
                    if (name) {
                      map.set(name, { id, name });
                    }
                  }
                });
              }

              if (map.size === 0 && (booth.kilaiName || booth.kilaiTamilName)) {
                const name =
                  locale === 'ta' && booth.kilaiTamilName
                    ? booth.kilaiTamilName
                    : booth.kilaiName || '';
                if (name) {
                  map.set(name, { id: booth.kilaiId, name });
                }
              }

              return Array.from(map.values());
            })();

            const totalCount = booth.totalCount || booth.totalVoters || 0;
            const maleCount = booth.maleCount || 0;
            const femaleCount = booth.femaleCount || 0;
            const thirdCount = booth.thirdGenderCount || 0;
            const agentsList = booth.agents || [];
            const agentsCount = agentsList.length > 0 ? agentsList.length : (booth._count?.agents || 0);
            const recentElection =
              booth.electionResults && booth.electionResults.length > 0
                ? booth.electionResults[0]
                : null;

            return (
              <div
                key={boothKey}
                className="group relative bg-white dark:bg-zinc-800/90 rounded-2xl border-2 border-gray-100 dark:border-zinc-700/80 hover:border-orange-500/50 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Accent Stripe */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Card Header: Booth Number, Area, Kilai Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-orange-600 text-white text-xs font-bold font-mono px-2.5 py-0.5 rounded-md shadow-2xs">
                          #{boothNumber}
                        </span>
                        {booth.area && (
                          <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            {booth.area}
                          </span>
                        )}
                      </div>

                      {showAssignedKilai && kilaisList.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap justify-end max-w-[200px]">
                          {kilaisList.map((k, kIdx) => (
                            <span
                              key={k.id || `${k.name}-${kIdx}`}
                              className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-medium truncate max-w-[140px]"
                              title={k.name}
                            >
                              {k.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <h4
                      className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-relaxed line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"
                      title={boothName}
                    >
                      {boothName}
                    </h4>
                  </div>

                  {/* Voter Demographics Matrix */}
                  <div className="grid grid-cols-4 gap-2 bg-gray-50/90 dark:bg-zinc-900/60 rounded-xl p-2.5 text-center text-xs border border-gray-100 dark:border-zinc-800">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        {locale === 'ta' ? 'ஆண்கள்' : 'Male'}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white font-mono">
                        {maleCount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        {locale === 'ta' ? 'பெண்கள்' : 'Female'}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white font-mono">
                        {femaleCount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        {locale === 'ta' ? 'மூன்றாம்' : 'Other'}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white font-mono">
                        {thirdCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-l border-gray-200 dark:border-zinc-800 pl-2">
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 block font-bold">
                        {locale === 'ta' ? 'மொத்தம்' : 'Total'}
                      </span>
                      <span className="font-extrabold text-orange-700 dark:text-orange-300 font-mono">
                        {totalCount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Booth Agents Row in Tile */}
                  {agentsList.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>{locale === 'ta' ? 'முகவர்கள்:' : 'Agents:'}</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {agentsList.slice(0, 3).map((agent: any) => {
                          const aName =
                            locale === 'ta'
                              ? translatePersonNameToTamil(agent.name) || agent.name
                              : agent.name;
                          return (
                            <span
                              key={agent.id || agent.name}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                            >
                              {aName}
                            </span>
                          );
                        })}
                        {agentsList.length > 3 && (
                          <span className="text-[10px] text-muted-foreground font-semibold px-1 py-0.5">
                            +{agentsList.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Result Row in Tile */}
                  {recentElection && (
                    <div className="bg-amber-50/70 dark:bg-zinc-900/60 rounded-xl p-2.5 border border-amber-200/70 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                            {recentElection.electionYear} {recentElection.electionName?.replace(/\d{4}\s*/, '')}
                          </p>
                          <p className="text-xs font-black text-[#8F0A1B] dark:text-red-400 font-mono">
                            {recentElection.tvkVotes?.toLocaleString()} {locale === 'ta' ? 'வாக்குகள்' : 'votes'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-black bg-[#FFC72C] text-[#8F0A1B] border border-amber-400/50 shadow-2xs shrink-0">
                        {recentElection.tvkPercentage}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Bottom Action Bar */}
                <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    {agentsCount} {locale === 'ta' ? 'முகவர்கள்' : 'Agents'}
                  </span>

                  <Link
                    href={`/booths?${new URLSearchParams({
                      ...(unionId ? { union: unionId } : {}),
                      ...(panchayatId ? { panchayat: panchayatId } : {}),
                      ...(villageId ? { village: villageId } : {}),
                      search: String(boothNumber),
                    }).toString()}`}
                    className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline font-semibold text-xs group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>{locale === 'ta' ? 'சாவடி விவரம்' : 'Booth Details'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phone Call Confirmation Dialog */}
      <CallConfirmationDialog
        person={callConfirmation}
        onOpenChange={(open) => !open && setCallConfirmation(null)}
      />
    </div>
  );
}
