'use client';

import { useParams } from 'next/navigation';
import { useUnion } from '@/hooks/use-unions';
import { ArrowLeft, Store, Building2, Users, Phone, Edit2, Trash2, Landmark, MapPin, ArrowUpRight, Search, LayoutGrid, ListFilter, Plus, ChevronRight } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useDeleteCadre } from '@/hooks/use-cadres';
import { useState, useMemo, useEffect } from 'react';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { CadreViewDialog } from '@/components/cadre-view-dialog';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { CadreCard } from '@/components/cadre-card';
import { CadreRosterTable } from '@/components/cadres/cadre-roster-table';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useQueryClient } from '@tanstack/react-query';
import { getOrgUnitName, getUnitTypeLabel, getAreasCoveredLabel, getUnionSlug } from '@/lib/org-unit-translations';
import { getAreaBilingualNames, isAreaNameMatch, createAreaSlug } from '@/lib/area-translations';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function UnionDetailsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { id } = useParams();
  const { data: union, isLoading } = useUnion(id as string);

  // Canonicalize URL: redirect UUID to clean slug /unions/[unionSlug]
  useEffect(() => {
    if (!union?.name) return;
    const cleanSlug = getUnionSlug(union.name);
    if (!cleanSlug) return;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id as string);
    if (isUuid) {
      router.replace(`/unions/${cleanSlug}`);
    }
  }, [union, id, router]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [callConfirmation, setCallConfirmation] = useState<{name: string, phone: string} | null>(null);
  const [viewingCadre, setViewingCadre] = useState<any | null>(null);
  const [areaSearch, setAreaSearch] = useState('');
  const [areaViewMode, setAreaViewMode] = useState<'cards' | 'chips'>('cards');
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteCadre();

  const dbPanchayats = useMemo(() => (union as any)?.panchayats || [], [union]);
  const hasDbPanchayats = dbPanchayats.length > 0;

  const filteredPanchayats = useMemo(() => {
    if (!hasDbPanchayats) return [];
    if (!areaSearch.trim()) return dbPanchayats;
    const q = areaSearch.toLowerCase().trim();
    return dbPanchayats.filter((p: any) =>
      p.name?.toLowerCase().includes(q) ||
      p.nameTa?.includes(q) ||
      p.code?.toLowerCase().includes(q)
    );
  }, [dbPanchayats, hasDbPanchayats, areaSearch]);

  const filteredAreas = useMemo(() => {
    if (hasDbPanchayats) return [];
    if (!union?.areasCovered) return [];
    if (!areaSearch.trim()) return union.areasCovered;
    const q = areaSearch.toLowerCase();
    return union.areasCovered.filter((area: string) => {
      const { en, ta } = getAreaBilingualNames(area);
      return area.toLowerCase().includes(q) || en.toLowerCase().includes(q) || ta.includes(q);
    });
  }, [union?.areasCovered, areaSearch, hasDbPanchayats]);

  const handleOpenEdit = (e: React.MouseEvent, cadre: any) => {
    e.stopPropagation();
    setEditingId(cadre.id);
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmation(id);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-medium">{locale === 'ta' ? 'அமைப்பு அலகு விவரங்களை ஏற்றுகிறது...' : 'Loading org unit details...'}</div>;
  if (!union) return <div className="p-8 text-center text-red-500 font-bold">{locale === 'ta' ? 'அமைப்பு அலகு கிடைக்கவில்லை' : 'Org unit not found'}</div>;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/unions" className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-gray-900">{getOrgUnitName(union, locale)}</h1>
            <p className="text-muted-foreground font-medium mt-1">
              {union.district?.name || 'Unknown'} {locale === 'ta' ? 'மாவட்டம்' : 'District'} • {union.group === 'KURINJIPADI' ? (locale === 'ta' ? 'குறிஞ்சிப்பாடி' : 'Kurinjipadi') : union.group === 'CUDDALORE' ? (locale === 'ta' ? 'கடலூர்' : 'Cuddalore') : union.group} • {getUnitTypeLabel(union.unitType, locale)}
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> {locale === 'ta' ? 'நிர்வாகியை பதிவு செய்' : 'Register Administrator'}
        </Button>
      </div>

      {/* Union Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Kilais */}
        <Link 
          href={`/kilais?union=${(union as any).id || (union as any)._id}`} 
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 dark:border-primary/30 shadow-md hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer flex items-center gap-3 sm:gap-4 text-left"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">{locale === 'ta' ? 'மொத்த கிளைகள்' : 'Total Kilais'}</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{union._count?.kilais || 0}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">{locale === 'ta' ? 'இந்த அமைப்பு அலகில்' : 'In this org unit'}</p>
          </div>
        </Link>

        {/* Total Booths */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 dark:border-primary/30 shadow-md flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">{locale === 'ta' ? 'மொத்த சாவடிகள்' : 'Total Booths'}</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{union.totalBooths || 0}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">{locale === 'ta' ? 'இந்த அமைப்பு அலகில்' : 'In this org unit'}</p>
          </div>
        </div>

        {/* Total Administrators */}
        <Link href={`/cadres?filterLevel=UNION&unionId=${union.id}&includeKilai=true`} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 dark:border-primary/30 shadow-md flex items-center gap-3 sm:gap-4 hover:shadow-lg transition-all hover:-translate-y-1 hover:border-primary/50 cursor-pointer">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">{locale === 'ta' ? 'மொத்த நிர்வாகிகள்' : 'Total Administrators'}</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{(union._count?.cadres || 0).toLocaleString()}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">{locale === 'ta' ? 'இந்த அமைப்பு அலகில் செயலில் உள்ளனர்' : 'Active across this org unit'}</p>
          </div>
        </Link>
      </div>

      {/* Panchayats / Wards Included */}
      {(hasDbPanchayats || (union.areasCovered && union.areasCovered.length > 0)) && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-sm border border-zinc-200/80 dark:border-zinc-800 space-y-5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-amber-500/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-heading font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {getAreasCoveredLabel(union.unitType, locale)}
                  </h2>
                  <span className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-red-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-primary/20 shadow-2xs">
                    {hasDbPanchayats ? filteredPanchayats.length : filteredAreas.length}
                    {(areaSearch.trim() && (hasDbPanchayats ? filteredPanchayats.length !== dbPanchayats.length : filteredAreas.length !== (union.areasCovered?.length || 0))) && (
                      <span className="opacity-60 ml-1">
                        / {hasDbPanchayats ? dbPanchayats.length : (union.areasCovered?.length || 0)}
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === 'ta'
                    ? 'ஊராட்சியை தேர்ந்தெடுத்து அதன் கிளைகள், சாவடிகள், கிராமங்கள் மற்றும் கள வரைபடத்தைக் காண்க'
                    : 'Select a panchayat or ward to explore kilai network, booths, villages, and field map'}
                </p>
              </div>
            </div>

            {/* Search Filter & View Mode Toggle */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-52 md:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  placeholder={locale === 'ta' ? 'ஊராட்சியைத் தேடுக...' : 'Search panchayat...'}
                  className="h-9 text-xs pl-9 pr-3 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/60 focus-visible:ring-primary/20"
                />
              </div>

              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 border border-zinc-200 dark:border-zinc-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setAreaViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    areaViewMode === 'cards'
                      ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title={locale === 'ta' ? 'கார்டுகள் பார்வை' : 'Cards View'}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAreaViewMode('chips')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    areaViewMode === 'chips'
                      ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title={locale === 'ta' ? 'சிறிய பட்டியல்' : 'Compact Chips'}
                >
                  <ListFilter className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Cards View Mode */}
          {areaViewMode === 'cards' ? (
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {hasDbPanchayats
                ? filteredPanchayats.map((p: any) => {
                    const primaryName = locale === 'ta' ? p.nameTa : p.name;
                    const secondaryName = locale === 'ta' ? p.name : p.nameTa;
                    const kilaisCount = p._count?.kilais || 0;
                    const boothsCount = p._count?.booths || 0;
                    const villagesCount = p._count?.villages || p.villages?.length || 0;
                    const isRural = p.type === 'VILLAGE_PANCHAYAT';
                    const unitTag = isRural
                      ? locale === 'ta'
                        ? 'ஊராட்சி'
                        : 'Panchayat'
                      : locale === 'ta'
                      ? 'வார்டு'
                      : 'Ward';

                    return (
                      <Link
                        key={p.id}
                        href={`/panchayats/${p.code || p.id}`}
                        className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-gradient-to-b from-white via-white to-zinc-50/60 dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-950 p-5 shadow-xs hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-primary/50 dark:hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                      >
                        {/* Ambient Glow & Accent Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 opacity-20 transition-all duration-500 pointer-events-none" />

                        <div>
                          {/* Top Row: Icon, Code & Status */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 via-amber-500/10 to-primary/5 flex items-center justify-center text-primary border border-primary/20 shadow-2xs group-hover:scale-105 group-hover:bg-primary/15 transition-all">
                                {isRural ? <Landmark className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-primary" />}
                              </div>
                              {p.code && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700/70">
                                  {p.code}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {kilaisCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {locale === 'ta' ? 'செயலில்' : 'Active'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
                                  {locale === 'ta' ? 'கள எல்லை' : 'Coverage'}
                                </span>
                              )}

                              <span className="w-7 h-7 rounded-full bg-zinc-100/80 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shadow-2xs">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>

                          {/* Titles */}
                          <div className="mb-3.5">
                            <h3 className="font-heading font-extrabold text-[17px] sm:text-[18px] text-zinc-900 dark:text-zinc-50 group-hover:text-primary dark:group-hover:text-primary transition-colors leading-snug line-clamp-1">
                              {primaryName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {secondaryName && secondaryName !== primaryName && (
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                  {secondaryName}
                                </span>
                              )}
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 uppercase tracking-wider">
                                {unitTag}
                              </span>
                            </div>
                          </div>

                          {/* 3-Column Micro-Metrics Grid */}
                          <div className="grid grid-cols-3 gap-2">
                            {/* Villages */}
                            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/40 text-center transition-colors group-hover:bg-blue-50/90 dark:group-hover:bg-blue-950/40">
                              <div className="flex items-center justify-center gap-1.5 text-blue-700 dark:text-blue-300 font-extrabold text-sm sm:text-base leading-none">
                                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span>{villagesCount}</span>
                              </div>
                              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
                                {locale === 'ta' ? 'கிராமங்கள்' : 'Villages'}
                              </p>
                            </div>

                            {/* Kilais */}
                            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40 text-center transition-colors group-hover:bg-emerald-50/90 dark:group-hover:bg-emerald-950/40">
                              <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm sm:text-base leading-none">
                                <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{kilaisCount}</span>
                              </div>
                              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
                                {locale === 'ta' ? 'கிளைகள்' : 'Kilais'}
                              </p>
                            </div>

                            {/* Booths */}
                            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/40 text-center transition-colors group-hover:bg-amber-50/90 dark:group-hover:bg-amber-950/40">
                              <div className="flex items-center justify-center gap-1.5 text-amber-700 dark:text-amber-300 font-extrabold text-sm sm:text-base leading-none">
                                <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>{boothsCount}</span>
                              </div>
                              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
                                {locale === 'ta' ? 'சாவடிகள்' : 'Booths'}
                              </p>
                            </div>
                          </div>

                          {/* Contextual Village Previews */}
                          {p.villages && p.villages.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-dashed border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                {locale === 'ta' ? 'கிராமங்கள்:' : 'Villages:'}
                              </span>
                              {p.villages.slice(0, 2).map((v: any, vIdx: number) => {
                                const vName = locale === 'ta' ? (v.nameTa || v.name) : (v.name || v.nameTa);
                                return (
                                  <span
                                    key={v.id || vIdx}
                                    className="inline-flex items-center text-[10px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 max-w-[110px] truncate"
                                    title={vName}
                                  >
                                    {vName}
                                  </span>
                                );
                              })}
                              {p.villages.length > 2 && (
                                <span className="text-[10px] font-bold text-primary dark:text-red-400 bg-primary/10 dark:bg-primary/20 px-1.5 py-0.5 rounded-md border border-primary/20">
                                  +{p.villages.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer Action */}
                        <div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                          <span>{locale === 'ta' ? 'கள விவரங்கள் & வரைபடம்' : 'Explore Details & Field Map'}</span>
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary group-hover:text-white transition-all text-zinc-500 group-hover:translate-x-1 shadow-2xs">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })
                : filteredAreas.map((area: string, idx: number) => {
                    const { en: areaEn, ta: areaTa } = getAreaBilingualNames(area);
                    const primaryName = locale === 'ta' ? areaTa : areaEn;
                    const secondaryName = locale === 'ta' ? areaEn : areaTa;

                    const matchingKilais = (union.kilais || []).filter(
                      (k: any) =>
                        isAreaNameMatch(k.panchayat, area) ||
                        (k.villages || []).some((v: string) => isAreaNameMatch(v, area))
                    );

                    const uniqueBooths = new Set<string>();
                    matchingKilais.forEach((k: any) => {
                      (k.booths || []).forEach((b: any) => uniqueBooths.add(b.id || b.boothNo));
                      (k.linkedBooths || []).forEach((bNo: string) => uniqueBooths.add(bNo));
                    });

                    const cadresCount = matchingKilais.reduce(
                      (sum: number, k: any) => sum + (k._count?.cadres || 0),
                      0
                    );

                    const slug = createAreaSlug(area);
                    const isUnionUnit = (union.unitType || 'UNION').toUpperCase() === 'UNION';
                    const unitTag = isUnionUnit
                      ? locale === 'ta'
                        ? 'ஊராட்சி'
                        : 'Panchayat'
                      : locale === 'ta'
                      ? 'வார்டு'
                      : 'Ward';

                    return (
                      <Link
                        key={idx}
                        href={`/panchayats/${encodeURIComponent(slug)}`}
                        className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-gradient-to-b from-white via-white to-zinc-50/60 dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-950 p-5 shadow-xs hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-primary/50 dark:hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                      >
                        {/* Ambient Glow & Accent Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 opacity-20 transition-all duration-500 pointer-events-none" />

                        <div>
                          {/* Top Row */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 via-amber-500/10 to-primary/5 flex items-center justify-center text-primary border border-primary/20 shadow-2xs group-hover:scale-105 group-hover:bg-primary/15 transition-all">
                              <Landmark className="w-5 h-5 text-primary" />
                            </div>

                            <div className="flex items-center gap-1.5">
                              {matchingKilais.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {locale === 'ta' ? 'செயலில்' : 'Active'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
                                  {locale === 'ta' ? 'கள எல்லை' : 'Coverage'}
                                </span>
                              )}

                              <span className="w-7 h-7 rounded-full bg-zinc-100/80 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shadow-2xs">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>

                          {/* Titles */}
                          <div className="mb-3.5">
                            <h3 className="font-heading font-extrabold text-[17px] sm:text-[18px] text-zinc-900 dark:text-zinc-50 group-hover:text-primary dark:group-hover:text-primary transition-colors leading-snug line-clamp-1">
                              {primaryName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {secondaryName && secondaryName !== primaryName && (
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                  {secondaryName}
                                </span>
                              )}
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 uppercase tracking-wider">
                                {unitTag}
                              </span>
                            </div>
                          </div>

                          {/* 3-Column Micro-Metrics Grid */}
                          <div className="grid grid-cols-3 gap-2">
                            {/* Kilais */}
                            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40 text-center transition-colors group-hover:bg-emerald-50/90 dark:group-hover:bg-emerald-950/40">
                              <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm sm:text-base leading-none">
                                <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{matchingKilais.length}</span>
                              </div>
                              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
                                {locale === 'ta' ? 'கிளைகள்' : 'Kilais'}
                              </p>
                            </div>

                            {/* Booths */}
                            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/40 text-center transition-colors group-hover:bg-amber-50/90 dark:group-hover:bg-amber-950/40">
                              <div className="flex items-center justify-center gap-1.5 text-amber-700 dark:text-amber-300 font-extrabold text-sm sm:text-base leading-none">
                                <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>{uniqueBooths.size}</span>
                              </div>
                              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
                                {locale === 'ta' ? 'சாவடிகள்' : 'Booths'}
                              </p>
                            </div>

                            {/* Cadres */}
                            <div className="p-2 sm:p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/80 dark:border-purple-900/40 text-center transition-colors group-hover:bg-purple-50/90 dark:group-hover:bg-purple-950/40">
                              <div className="flex items-center justify-center gap-1.5 text-purple-700 dark:text-purple-300 font-extrabold text-sm sm:text-base leading-none">
                                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                <span>{cadresCount}</span>
                              </div>
                              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
                                {locale === 'ta' ? 'நிர்வாகிகள்' : 'Cadres'}
                              </p>
                            </div>
                          </div>

                          {/* Contextual Kilais Preview */}
                          {matchingKilais.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-dashed border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                {locale === 'ta' ? 'கிளைகள்:' : 'Kilais:'}
                              </span>
                              {matchingKilais.slice(0, 2).map((k: any, kIdx: number) => (
                                <span
                                  key={k.id || kIdx}
                                  className="inline-flex items-center text-[10px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 max-w-[110px] truncate"
                                  title={k.name}
                                >
                                  {k.name}
                                </span>
                              ))}
                              {matchingKilais.length > 2 && (
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded-md">
                                  +{matchingKilais.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer Action */}
                        <div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                          <span>{locale === 'ta' ? 'கள விவரங்கள் & வரைபடம்' : 'Explore Details & Field Map'}</span>
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary group-hover:text-white transition-all text-zinc-500 group-hover:translate-x-1 shadow-2xs">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
            </div>
          ) : (
            /* Compact Chips View Mode */
            <div className="flex flex-wrap gap-2.5">
              {hasDbPanchayats
                ? filteredPanchayats.map((p: any) => {
                    const isRural = p.type === 'VILLAGE_PANCHAYAT';
                    const primaryName = locale === 'ta' ? p.nameTa : p.name;
                    const kilaisCount = p._count?.kilais || 0;
                    return (
                      <Link
                        key={p.id}
                        href={`/panchayats/${p.code || p.id}`}
                        className="group inline-flex items-center gap-2.5 text-xs font-bold bg-white dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200/90 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                          {isRural ? <Landmark className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        </div>
                        <span>{primaryName}</span>
                        {p.code && (
                          <span className="text-[10px] font-mono text-zinc-400 group-hover:text-primary/70">
                            ({p.code})
                          </span>
                        )}
                        {kilaisCount > 0 ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {kilaisCount} {locale === 'ta' ? 'கிளை' : 'K'}
                          </span>
                        ) : null}
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    );
                  })
                : filteredAreas.map((area: string, idx: number) => {
                    const { en: areaEn, ta: areaTa } = getAreaBilingualNames(area);
                    const slug = createAreaSlug(area);
                    return (
                      <Link
                        key={idx}
                        href={`/panchayats/${encodeURIComponent(slug)}`}
                        className="group inline-flex items-center gap-2.5 text-xs font-bold bg-white dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200/90 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                          <MapPin className="w-3 h-3" />
                        </div>
                        <span>{locale === 'ta' ? areaTa : areaEn}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    );
                  })}
            </div>
          )}

          {((hasDbPanchayats && filteredPanchayats.length === 0) ||
            (!hasDbPanchayats && filteredAreas.length === 0)) && (
            <div className="text-center py-12 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-3">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {locale === 'ta' ? 'பொருத்தமான ஊராட்சிகள் எதுவும் கிடைக்கவில்லை' : 'No matching panchayats found'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === 'ta' ? 'வேறு தேடல் சொல்லை முயற்சிக்கவும்' : 'Try searching with a different name or keyword'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Org Unit Administrators Table / Roster with PDF Generator */}
      <CadreRosterTable
        cadres={union.unionCadres || []}
        title={locale === 'ta' ? 'அமைப்பு அலகு நிர்வாகிகள்' : 'Org Unit Administrators'}
        unionName={getOrgUnitName(union, locale)}
        unitName={getOrgUnitName(union, locale)}
        unitType={getUnitTypeLabel(union.unitType, locale)}
        districtName={union.district?.name}
        panchayatName={
          hasDbPanchayats
            ? dbPanchayats.length <= 5
              ? dbPanchayats.map((p: any) => (locale === 'ta' && p.nameTa ? p.nameTa : p.name)).join(', ')
              : `${dbPanchayats.length} ${locale === 'ta' ? 'ஊராட்சிகள்' : 'Panchayats'}`
            : union.areasCovered && union.areasCovered.length > 0
            ? union.areasCovered.length <= 5
              ? union.areasCovered.join(', ')
              : `${union.areasCovered.length} ${locale === 'ta' ? 'பகுதிகள்' : 'Areas'}`
            : '-'
        }
        boothDetails={
          union.totalBooths
            ? `${union.totalBooths} ${locale === 'ta' ? 'சாவடிகள்' : 'Booths'}`
            : '-'
        }
        defaultView="table"
        onView={(c) => setViewingCadre(c)}
        onEdit={(e, c) => handleOpenEdit(e, c)}
        onDelete={(e, id) => handleDelete(e, id)}
        onCall={(person) => setCallConfirmation(person)}
      />

      
      <CadreFormDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingId={editingId}
        cadres={union.unionCadres}
        defaultLevel="UNION"
        lockLevel={true}
        defaultUnionId={union.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['unions'] });
        }}
      />

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
            <DialogTitle>Delete Administrator</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this administrator? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (deleteConfirmation) {
                  deleteMutation.mutate(deleteConfirmation, {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ['unions'] });
                      setDeleteConfirmation(null);
                    }
                  });
                }
              }}
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
