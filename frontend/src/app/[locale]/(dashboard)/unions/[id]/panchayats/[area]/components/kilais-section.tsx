'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  Store,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Phone,
  ArrowUpRight,
  MapPin,
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
import { getKilaiSlug } from '@/lib/org-unit-translations';

export interface KilaisSectionProps {
  kilais?: any[];
  panchayatKilais?: any[];
  title?: string;
  subtitle?: string;
  areaNameEn?: string;
  areaNameTa?: string;
  unionId?: string;
  panchayatId?: string;
  villageId?: string;
  locale: string;
}

// Helper to translate cadre roles
function getRoleLabel(role: string | null | undefined, locale: string): string {
  if (!role) return locale === 'ta' ? 'நிர்வாகி' : 'Cadre';
  if (locale !== 'ta') return role;
  const lower = role.toLowerCase().trim();
  if (lower === 'secretary') return 'செயலாளர்';
  if (lower === 'joint secretary') return 'இணைச் செயலாளர்';
  if (lower === 'deputy secretary') return 'துணைச் செயலாளர்';
  if (lower === 'treasurer') return 'பொருளாளர்';
  if (lower === 'executive committee member' || lower === 'ec member') return 'செயற்குழு உறுப்பினர்';
  if (lower === 'president') return 'தலைவர்';
  if (lower === 'vice president') return 'துணைத் தலைவர்';
  if (lower === 'coordinator') return 'ஒருங்கிணைப்பாளர்';
  return role;
}

// Helper to extract lowest numeric booth number for sorting
function getMinBoothNo(item: any): number {
  const booths = item.booths || item.linkedBooths || [];
  if (!booths || booths.length === 0) return 999999;
  const numbers = booths
    .map((b: any) => {
      const raw = String(b.boothNo || b.number || '').replace(/\D/g, '');
      return raw ? parseInt(raw, 10) : NaN;
    })
    .filter((n: number) => !isNaN(n));
  return numbers.length > 0 ? Math.min(...numbers) : 999999;
}

export function KilaisSection({
  kilais,
  panchayatKilais,
  title,
  subtitle,
  areaNameEn = '',
  areaNameTa = '',
  unionId,
  panchayatId,
  villageId,
  locale,
}: KilaisSectionProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'table' | 'tile'>('table');
  const [callConfirmation, setCallConfirmation] = useState<{ name: string; phone: string } | null>(null);
  const [expandedKilaiIds, setExpandedKilaiIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('tile');
    }
  }, []);

  // Sort kilais in ascending order by booth number, tie-breaking by name
  const sortedKilais = useMemo(() => {
    const rawList = kilais || panchayatKilais || [];
    return [...rawList]
      .map((k: any) => {
        const rawBooths = k.booths || k.linkedBooths || [];
        const booths = [...rawBooths].sort((a: any, b: any) => {
          const numA = parseInt(String(a.boothNo || '').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(String(b.boothNo || '').replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
        return { ...k, booths };
      })
      .sort((a: any, b: any) => {
        const aMin = getMinBoothNo(a);
        const bMin = getMinBoothNo(b);
        if (aMin !== bMin) return aMin - bMin;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [kilais, panchayatKilais]);

  // Check which kilais have other cadres
  const kilaisWithOtherCadres = useMemo(() => {
    return sortedKilais.filter((k: any) => {
      const rawSecretaryLow = (k.secretaryName || '').trim().toLowerCase();
      const other = (k.cadres || []).filter((c: any) => {
        const cName = (c.name || '').trim().toLowerCase();
        const isSec =
          (rawSecretaryLow && cName === rawSecretaryLow) ||
          (c.role?.toLowerCase() === 'secretary' && rawSecretaryLow === cName);
        return !isSec;
      });
      return other.length > 0;
    });
  }, [sortedKilais]);

  const hasAnyOtherCadres = kilaisWithOtherCadres.length > 0;

  // Toggle single kilai expand/collapse
  const toggleExpand = (kilaiId: string) => {
    setExpandedKilaiIds((prev) => ({
      ...prev,
      [kilaiId]: !prev[kilaiId],
    }));
  };

  // Check if all expandable kilais are currently expanded
  const allExpanded = useMemo(() => {
    if (kilaisWithOtherCadres.length === 0) return false;
    return kilaisWithOtherCadres.every((k: any) => Boolean(expandedKilaiIds[k.id]));
  }, [kilaisWithOtherCadres, expandedKilaiIds]);

  // Master toggle all expandable kilais
  const toggleAllExpanded = () => {
    const nextState = !allExpanded;
    const nextMap: Record<string, boolean> = {};
    kilaisWithOtherCadres.forEach((k: any) => {
      nextMap[k.id] = nextState;
    });
    setExpandedKilaiIds(nextMap);
  };

  const sectionTitle =
    title ||
    (locale === 'ta'
      ? `${areaNameTa || 'பகுதி'} - கிளை அமைப்புகள்`
      : `Kilais in ${areaNameEn || 'Area'}`);

  const sectionSubtitle =
    subtitle ||
    (locale === 'ta'
      ? 'களப்பணியாற்றும் கழகக் கிளை அமைப்புகள், நிர்வாகிகள் மற்றும் சாவடிப் பொறுப்புகள்'
      : 'Grassroot Kilai units actively overseeing field operations, leaders, and booth assignments');

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-4">
      {/* Section Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/10 via-slate-500/10 to-amber-500/10 border border-slate-500/20 text-slate-700 dark:text-slate-400 flex items-center justify-center shrink-0 shadow-xs">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {sectionTitle}
              </h2>
              <Badge className="bg-slate-50 text-slate-700 dark:bg-slate-950/50 dark:text-slate-300 border-slate-200 dark:border-slate-800/80 font-bold text-xs">
                {sortedKilais.length} {locale === 'ta' ? 'கிளைகள்' : 'Kilais'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sectionSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Master Expand / Collapse Button in Table View */}
          {viewMode === 'table' && hasAnyOtherCadres && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllExpanded}
              className="h-8 text-xs font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-950/40 flex items-center gap-1.5 shadow-2xs"
              title={
                allExpanded
                  ? locale === 'ta'
                    ? 'அனைத்து நிர்வாகிகளையும் சுருக்கு'
                    : 'Collapse All'
                  : locale === 'ta'
                  ? 'அனைத்து நிர்வாகிகளையும் விரி'
                  : 'Expand All'
              }
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                  <span>{locale === 'ta' ? 'அனைத்தையும் சுருக்கு' : 'Collapse All'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                  <span>{locale === 'ta' ? 'அனைத்தையும் விரி' : 'Expand All'}</span>
                </>
              )}
            </Button>
          )}

          {/* View Mode Toggle: Table / Tiles */}
          {sortedKilais.length > 0 && (
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700/60 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 shadow-xs'
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
                    ? 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={locale === 'ta' ? 'கட்டக் காட்சி' : 'Tile View'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{locale === 'ta' ? 'அட்டைகள்' : 'Tiles'}</span>
              </button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams();
              if (unionId) params.append('union', unionId);
              if (panchayatId) params.append('panchayat', panchayatId);
              if (villageId) params.append('village', villageId);
              const qs = params.toString() ? `?${params.toString()}` : '';
              router.push(`/kilais${qs}`);
            }}
            className="text-xs text-primary font-semibold hover:bg-primary/5 cursor-pointer"
          >
            {locale === 'ta' ? 'அனைத்து கிளைகள்' : 'All Kilais'} →
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {sortedKilais.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40">
          <Store className="w-10 h-10 text-gray-400 mx-auto mb-2.5 opacity-60" />
          <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
            {locale === 'ta'
              ? 'கிளைகள் எதுவும் பதிவு செய்யப்படவில்லை.'
              : 'No kilais registered yet.'}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {locale === 'ta'
              ? 'புதிய கிளையை உருவாக்கி சாவடிகளையும் நிர்வாகிகளையும் இணைக்கவும்.'
              : 'Create a new kilai in directory to link polling booths and grassroots cadres.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <Table>
            <TableHeader className="bg-gray-50/80 dark:bg-zinc-800/50">
              <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-zinc-800">
                <TableHead className="w-14 text-center text-xs font-bold text-gray-500 dark:text-zinc-400">#</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                  {locale === 'ta' ? 'கிளை பெயர்' : 'Kilai Name'}
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                  {locale === 'ta' ? 'நிலை' : 'Status'}
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                  {locale === 'ta' ? 'செயலாளர்' : 'Secretary'}
                </TableHead>
                <TableHead className="w-36 text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5 text-center">
                  {locale === 'ta' ? 'சாவடி எண்' : 'Booth No.'}
                </TableHead>
                <TableHead className="w-32 text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5 text-center">
                  {locale === 'ta' ? 'நிர்வாகிகள்' : 'Cadres'}
                </TableHead>
                <TableHead className="w-24 text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5 text-right">
                  {locale === 'ta' ? 'செயல்' : 'Action'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedKilais.map((kilai: any, idx: number) => {
                const taName = kilai.translations?.ta?.name || kilai.tamilName || '';
                const displayName = locale === 'ta' && taName ? taName : kilai.name;
                const secondaryName =
                  locale === 'ta' && kilai.name && kilai.name !== displayName
                    ? kilai.name
                    : locale !== 'ta' && taName
                    ? taName
                    : null;

                const rawSecretary = (kilai.secretaryName || '').trim();
                const secretaryName =
                  locale === 'ta' && rawSecretary
                    ? (kilai.translations?.ta?.secretaryName || translatePersonNameToTamil(rawSecretary) || rawSecretary)
                    : rawSecretary;

                const rawSecretaryLow = rawSecretary.toLowerCase();
                const otherCadres = (kilai.cadres || []).filter((c: any) => {
                  const cName = (c.name || '').trim().toLowerCase();
                  const isSec =
                    (rawSecretaryLow && cName === rawSecretaryLow) ||
                    (c.role?.toLowerCase() === 'secretary' && rawSecretaryLow === cName);
                  return !isSec;
                });

                const cadresCount = kilai._count?.cadres ?? (kilai.cadres?.length || 0);
                const isExpanded = Boolean(expandedKilaiIds[kilai.id]);

                return (
                  <React.Fragment key={kilai.id}>
                    {/* Main Kilai Row */}
                    <TableRow
                      onClick={() => {
                        if (otherCadres.length > 0) {
                          toggleExpand(kilai.id);
                        }
                      }}
                      className={`group transition-all select-none border-b ${
                        isExpanded && otherCadres.length > 0
                          ? 'bg-slate-50/30 dark:bg-zinc-800/60 border-slate-200/60 dark:border-slate-900/40'
                          : 'hover:bg-slate-50/20 dark:hover:bg-slate-950/10 border-gray-100 dark:border-zinc-800/80'
                      } ${otherCadres.length > 0 ? 'cursor-pointer' : ''}`}
                    >
                      {/* Interactive Expand / Collapse Column */}
                      <TableCell className="text-center py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                          {otherCadres.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(kilai.id);
                              }}
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                isExpanded
                                  ? 'bg-slate-600 text-white shadow-2xs rotate-180 hover:bg-slate-700'
                                  : 'bg-slate-50 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300 hover:bg-slate-100 hover:scale-105 border border-slate-200/60 dark:border-slate-800/60'
                              }`}
                              title={isExpanded ? (locale === 'ta' ? 'சுருக்கு' : 'Collapse') : (locale === 'ta' ? 'விரி' : 'Expand')}
                            >
                              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
                            </button>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                            {displayName}
                          </span>
                          {secondaryName && (
                            <span className="text-xs text-muted-foreground">{secondaryName}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {kilai.status === 'ACTIVE' ? (locale === 'ta' ? 'செயலில்' : 'Active') : kilai.status || 'Active'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        {secretaryName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {secretaryName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-gray-900 dark:text-white">
                                {secretaryName}
                              </span>
                              {kilai.phone && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCallConfirmation({
                                      name: secretaryName,
                                      phone: kilai.phone,
                                    });
                                  }}
                                  className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 text-left"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  {kilai.phone}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {locale === 'ta' ? 'நியமிக்கப்படவில்லை' : 'Not Assigned'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        {kilai.booths && kilai.booths.length > 0 ? (
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {kilai.booths.map((b: any) => (
                              <span
                                key={b.id || b.boothNo}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 shadow-2xs"
                              >
                                <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                #{b.boothNo}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center">
                          {otherCadres.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(kilai.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                isExpanded
                                  ? 'bg-slate-600 text-white border-slate-600 shadow-xs ring-2 ring-slate-400/30'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800/60 hover:scale-105'
                              }`}
                              title={isExpanded ? (locale === 'ta' ? 'சுருக்கு' : 'Collapse') : (locale === 'ta' ? 'விரி' : 'Expand')}
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>{cadresCount}</span>
                              <span className="text-[10px] opacity-80 font-normal">
                                (+{otherCadres.length})
                              </span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-white' : 'text-slate-600 dark:text-slate-400'
                                }`}
                              />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/50">
                              <Users className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                              {cadresCount}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Link
                          href={`/kilais/${getKilaiSlug(kilai.name) || kilai.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          <span>{locale === 'ta' ? 'விவரம்' : 'View'}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </TableCell>
                    </TableRow>

                    {/* Interactive Drawer for Other Cadres */}
                    {isExpanded && otherCadres.length > 0 && (
                      <TableRow className="bg-[#f3f3ed] hover:bg-[#f3f3ed] dark:bg-zinc-850/60 dark:hover:bg-zinc-850/60 border-b border-teal-200/50 dark:border-zinc-700/60">
                        <TableCell colSpan={7} className="p-0">
                          <div className="w-full max-w-full min-w-0 border-l-4 border-l-primary bg-[#f3f3ed] dark:bg-zinc-900/95 p-3.5 sm:p-5 md:p-6 space-y-3.5 overflow-hidden">
                            {/* Drawer Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-teal-100 dark:border-zinc-800">
                              <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                  <Users className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                                      {locale === 'ta'
                                        ? `${displayName} - பிற பொறுப்பாளர்கள் & நிர்வாகிகள்`
                                        : `Additional Office Bearers & Cadres in ${displayName}`}
                                    </h4>
                                    <Badge className="bg-slate-800 text-slate-100  border-slate-200 text-[10px] font-bold px-2 py-0 shrink-0">
                                      {otherCadres.length} {locale === 'ta' ? 'நிர்வாகிகள்' : 'Cadres'}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug break-words">
                                    {locale === 'ta'
                                      ? 'இந்தக் கிளைக்கு பதிவு செய்யப்பட்ட பிற பொறுப்பாளர்கள் மற்றும் கள நிர்வாகிகள்'
                                      : 'Grassroots leaders actively working alongside the Kilai Secretary'}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(kilai.id);
                                }}
                                className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1 shrink-0 self-end sm:self-center px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                              >
                                <span>{locale === 'ta' ? 'சுருக்கு' : 'Collapse'}</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Cadres Grid / Cards */}
                            <div className="grid gap-2 sm:gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                              {otherCadres.map((cadre: any) => {
                                const cadreName =
                                  locale === 'ta' &&
                                  (cadre.translations?.ta?.name || translatePersonNameToTamil(cadre.name))
                                    ? cadre.translations?.ta?.name || translatePersonNameToTamil(cadre.name)
                                    : cadre.name;
                                const roleLabel = getRoleLabel(cadre.role, locale);

                                return (
                                  <div
                                    key={cadre.id}
                                    className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-teal-100/80 dark:border-zinc-700/80 shadow-2xs hover:shadow-xs hover:border-teal-300 transition-all space-y-2"
                                  >
                                    <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2">
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-red-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                          {cadre.name?.charAt(0) || 'C'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                                            {cadreName}
                                          </p>
                                          {cadre.memberId && (
                                            <p className="text-[10px] font-mono text-muted-foreground truncate">
                                              {cadre.memberId}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <Badge
                                        variant="outline"
                                        className="bg-slate-50 dark:bg-teal-950/50 text-slate-800 dark:text-teal-300 border-slate-200 dark:border-teal-800/80 text-[10px] font-bold px-2 py-0.5 shrink-0 max-w-[130px] truncate"
                                      >
                                        {roleLabel}
                                      </Badge>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 dark:border-zinc-700/60 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                                      {cadre.phone ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCallConfirmation({
                                              name: cadreName,
                                              phone: cadre.phone,
                                            });
                                          }}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold hover:bg-emerald-100 transition-colors shrink-0"
                                        >
                                          <Phone className="w-3 h-3 text-emerald-600" />
                                          <span>{cadre.phone}</span>
                                        </button>
                                      ) : (
                                        <span className="text-xs text-muted-foreground italic">-</span>
                                      )}

                                      {cadre.boothNo && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 shrink-0">
                                          <Building2 className="w-2.5 h-2.5 text-amber-600" />
                                          #{cadre.boothNo}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
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
        /* Attractive Modern Tile View */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedKilais.map((kilai: any) => {
            const taName = kilai.translations?.ta?.name || kilai.tamilName || '';
            const displayName = locale === 'ta' && taName ? taName : kilai.name;
            const secondaryName =
              locale === 'ta' && kilai.name && kilai.name !== displayName
                ? kilai.name
                : locale !== 'ta' && taName
                ? taName
                : null;

            const rawSecretary = (kilai.secretaryName || '').trim();
            const secretaryName =
              locale === 'ta' && rawSecretary
                ? (kilai.translations?.ta?.secretaryName || translatePersonNameToTamil(rawSecretary) || rawSecretary)
                : rawSecretary;

            const rawSecretaryLow = rawSecretary.toLowerCase();
            const otherCadres = (kilai.cadres || []).filter((c: any) => {
              const cName = (c.name || '').trim().toLowerCase();
              const isSec =
                (rawSecretaryLow && cName === rawSecretaryLow) ||
                (c.role?.toLowerCase() === 'secretary' && rawSecretaryLow === cName);
              return !isSec;
            });

            const cadresCount = kilai._count?.cadres ?? (kilai.cadres?.length || 0);
            const boothsCount = kilai.booths?.length || 0;

            return (
              <div
                key={kilai.id}
                className="group relative bg-white dark:bg-zinc-800/90 rounded-2xl border-2 border-gray-100 dark:border-zinc-700/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Top TVK Gradient Accent Stripe */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-amber-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Card Header: Icon, Name, Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-primary/10 to-amber-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <Store className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-extrabold text-gray-900 dark:text-white text-lg leading-tight truncate group-hover:text-primary transition-colors">
                          {displayName}
                        </h3>
                        {secondaryName && (
                          <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">
                            {secondaryName}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {kilai.status === 'ACTIVE'
                        ? locale === 'ta'
                          ? 'செயலில்'
                          : 'Active'
                        : kilai.status || 'Active'}
                    </span>
                  </div>

                  {/* Metric Chips Row */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-900/50">
                      <div className="w-8 h-8 rounded-lg bg-slate-500/15 flex items-center justify-center text-slate-700 dark:text-slate-300">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700/80 dark:text-slate-300/80">
                          {locale === 'ta' ? 'நிர்வாகிகள்' : 'Cadres'}
                        </span>
                        <p className="text-sm font-extrabold text-slate-950 dark:text-slate-100">
                          {cadresCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-700 dark:text-amber-300">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80">
                          {locale === 'ta' ? 'சாவடிகள்' : 'Booths'}
                        </span>
                        <p className="text-sm font-extrabold text-amber-950 dark:text-amber-100">
                          {boothsCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Secretary Leadership Highlight Card */}
                  {secretaryName && (
                    <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-zinc-900/80 dark:to-zinc-800/50 rounded-xl p-3 border border-gray-200/80 dark:border-zinc-700/70 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-red-800 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                            {secretaryName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 dark:text-emerald-400">
                              {locale === 'ta' ? 'கிளைச் செயலாளர்' : 'Branch Secretary'}
                            </p>
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {secretaryName}
                            </p>
                          </div>
                        </div>

                        {kilai.phone && (
                          <button
                            type="button"
                            onClick={() =>
                              setCallConfirmation({
                                name: secretaryName,
                                phone: kilai.phone,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all shrink-0 active:scale-95"
                            title={locale === 'ta' ? 'அழைக்க' : 'Call Secretary'}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{locale === 'ta' ? 'அழைக்க' : 'Call'}</span>
                          </button>
                        )}
                      </div>

                      {kilai.phone && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-zinc-700/60 text-[11px] text-muted-foreground">
                          <span className="font-mono tracking-wide">{kilai.phone}</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {locale === 'ta' ? 'தொடர்பில்' : 'Available'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assigned Polling Booths Badges */}
                  {kilai.booths && kilai.booths.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300">
                        {locale === 'ta' ? 'பொறுப்பு வாக்குச்சாவடிகள்:' : 'Assigned Polling Booths:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {kilai.booths.map((b: any) => (
                          <span
                            key={b.id || b.boothNo}
                            className="inline-flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1 rounded-lg font-mono font-bold shadow-2xs"
                          >
                            <Building2 className="w-3 h-3 text-amber-600" />
                            #{b.boothNo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Cadres List in Tile View */}
                  {otherCadres.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-700/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          <span>{locale === 'ta' ? 'பிற நிர்வாகிகள்:' : 'Other Cadres:'}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-bold">
                            {otherCadres.length}
                          </span>
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {otherCadres.map((c: any) => {
                          const cName =
                            locale === 'ta' &&
                            (c.translations?.ta?.name || translatePersonNameToTamil(c.name))
                              ? c.translations?.ta?.name || translatePersonNameToTamil(c.name)
                              : c.name;
                          const cRole = getRoleLabel(c.role, locale);

                          return (
                            <div
                              key={c.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-gray-50/90 dark:bg-zinc-900/60 border border-gray-200/70 dark:border-zinc-700/60 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-red-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                  {c.name?.charAt(0) || 'C'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-white truncate text-xs">
                                    {cName}
                                  </p>
                                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                    {cRole}
                                  </span>
                                </div>
                              </div>
                              {c.phone && (
                                <button
                                  type="button"
                                  onClick={() => setCallConfirmation({ name: cName, phone: c.phone })}
                                  className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{c.phone}</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom Action Bar */}
                <div className="px-5 py-3.5 bg-gray-50/80 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{kilai.panchayat || areaNameEn}</span>
                  </div>

                  <Link
                    href={`/kilais/${getKilaiSlug(kilai.name) || kilai.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:text-primary hover:underline transition-colors"
                  >
                    <span>{locale === 'ta' ? 'கிளை விவரம்' : 'View Kilai'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Call Confirmation Dialog */}
      <CallConfirmationDialog
        person={callConfirmation}
        onOpenChange={(open) => !open && setCallConfirmation(null)}
      />
    </div>
  );
}
