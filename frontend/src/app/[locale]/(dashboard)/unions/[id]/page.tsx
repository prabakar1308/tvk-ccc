'use client';

import { useParams } from 'next/navigation';
import { useUnion } from '@/hooks/use-unions';
import { ArrowLeft, Store, Building2, Users, Phone, Edit2, Trash2, Landmark, MapPin, ArrowUpRight, Search, LayoutGrid, ListFilter } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useDeleteCadre } from '@/hooks/use-cadres';
import { useState, useMemo } from 'react';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { CadreViewDialog } from '@/components/cadre-view-dialog';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CadreCard } from '@/components/cadre-card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useQueryClient } from '@tanstack/react-query';
import { getOrgUnitName, getUnitTypeLabel, getAreasCoveredLabel } from '@/lib/org-unit-translations';
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
  const { id } = useParams();
  const { data: union, isLoading } = useUnion(id as string);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [callConfirmation, setCallConfirmation] = useState<{name: string, phone: string} | null>(null);
  const [viewingCadre, setViewingCadre] = useState<any | null>(null);
  const [areaSearch, setAreaSearch] = useState('');
  const [areaViewMode, setAreaViewMode] = useState<'cards' | 'chips'>('cards');
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteCadre();

  const filteredAreas = useMemo(() => {
    if (!union?.areasCovered) return [];
    if (!areaSearch.trim()) return union.areasCovered;
    const q = areaSearch.toLowerCase();
    return union.areasCovered.filter((area: string) => {
      const { en, ta } = getAreaBilingualNames(area);
      return area.toLowerCase().includes(q) || en.toLowerCase().includes(q) || ta.includes(q);
    });
  }, [union?.areasCovered, areaSearch]);

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
      {union.areasCovered && union.areasCovered.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-wide">
                    {getAreasCoveredLabel(union.unitType, locale)}
                  </h2>
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold border border-primary/20">
                    {union.areasCovered.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === 'ta'
                    ? 'ஊராட்சியை கிளிக் செய்து அதன் கிளைகள், சாவடிகள், நிர்வாகிகள் மற்றும் கள வரைபடத்தைக் காண்க'
                    : 'Click on each panchayat or ward to explore kilai network, booths, cadre strength, and field map'}
                </p>
              </div>
            </div>

            {/* Search Filter & View Mode Toggle */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48 md:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  placeholder={locale === 'ta' ? 'தேடுக...' : 'Search...'}
                  className="h-8 text-xs pl-8 pr-2.5 rounded-lg border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50"
                />
              </div>

              <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-gray-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setAreaViewMode('cards')}
                  className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                    areaViewMode === 'cards'
                      ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                  }`}
                  title={locale === 'ta' ? 'கார்டுகள் பார்வை' : 'Cards View'}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAreaViewMode('chips')}
                  className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                    areaViewMode === 'chips'
                      ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                  }`}
                  title={locale === 'ta' ? 'சிறிய பட்டியல்' : 'Compact Chips'}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Cards View Mode */}
          {areaViewMode === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAreas.map((area: string, idx: number) => {
                const { en: areaEn, ta: areaTa } = getAreaBilingualNames(area);
                const primaryName = locale === 'ta' ? areaTa : areaEn;
                const secondaryName = locale === 'ta' ? areaEn : areaTa;

                // Match kilais
                const matchingKilais = (union.kilais || []).filter(
                  (k: any) =>
                    isAreaNameMatch(k.panchayat, area) ||
                    (k.villages || []).some((v: string) => isAreaNameMatch(v, area))
                );

                // Count unique booths
                const uniqueBooths = new Set<string>();
                matchingKilais.forEach((k: any) => {
                  (k.booths || []).forEach((b: any) => uniqueBooths.add(b.id || b.boothNo));
                  (k.linkedBooths || []).forEach((bNo: string) => uniqueBooths.add(bNo));
                });

                // Count cadres
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
                    href={`/unions/${union.id}/panchayats/${encodeURIComponent(slug)}`}
                    className="group relative bg-white dark:bg-zinc-800/80 rounded-2xl p-4 sm:p-5 border-2 border-gray-100 dark:border-zinc-700/80 hover:border-primary/50 dark:hover:border-primary/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Top Accent Gradient Bar on Hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Top Bar with Icon & Status Pill */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-amber-500/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>

                        <div className="flex items-center gap-1.5">
                          {matchingKilais.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              {locale === 'ta' ? 'செயலில்' : 'Active'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {locale === 'ta' ? 'கிளை தயார்' : 'Coverage'}
                            </span>
                          )}

                          <span className="p-1 rounded-full text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>

                      {/* Panchayat Names */}
                      <div className="mb-3.5">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg group-hover:text-primary transition-colors leading-snug">
                            {primaryName}
                          </h3>
                        </div>
                        {secondaryName && secondaryName !== primaryName && (
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {secondaryName} • <span className="text-gray-500">{unitTag}</span>
                          </p>
                        )}
                      </div>

                      {/* Micro-Stats Strip */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-gray-50/80 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1 text-gray-900 dark:text-white font-bold text-sm">
                            <Store className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            {matchingKilais.length}
                          </div>
                          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                            {locale === 'ta' ? 'கிளைகள்' : 'Kilais'}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-center gap-1 text-gray-900 dark:text-white font-bold text-sm">
                            <Building2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                            {uniqueBooths.size}
                          </div>
                          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                            {locale === 'ta' ? 'சாவடிகள்' : 'Booths'}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-center gap-1 text-gray-900 dark:text-white font-bold text-sm">
                            <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            {cadresCount}
                          </div>
                          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                            {locale === 'ta' ? 'நிர்வாகிகள்' : 'Cadres'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="pt-3 mt-3 border-t border-gray-100 dark:border-zinc-700/50 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>{locale === 'ta' ? 'கள விவரங்கள் & வரைபடம்' : 'View Details & Field Map'}</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Compact Chips View Mode */
            <div className="flex flex-wrap gap-2.5">
              {filteredAreas.map((area: string, idx: number) => {
                const { en: areaEn, ta: areaTa } = getAreaBilingualNames(area);
                const slug = createAreaSlug(area);
                return (
                  <Link
                    key={idx}
                    href={`/unions/${union.id}/panchayats/${encodeURIComponent(slug)}`}
                    className="inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase bg-gray-50 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 rounded-lg px-3.5 py-2 shadow-xs hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                    <span>{locale === 'ta' ? areaTa : areaEn}</span>
                    <ArrowUpRight className="w-3 h-3 text-gray-400 group-hover:text-primary transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}

          {filteredAreas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs font-medium">
              {locale === 'ta' ? 'பொருத்தமான ஊராட்சிகள் எதுவும் கிடைக்கவில்லை.' : 'No matching panchayats found.'}
            </div>
          )}
        </div>
      )}

      {/* Cadres Grid */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-gray-900 tracking-wide">{locale === 'ta' ? 'அமைப்பு அலகு நிர்வாகிகள்' : 'Org Unit Administrators'}</h2>
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-sm font-bold border border-primary/20">
            {union.unionCadres?.length || 0}
          </span>
        </div>
        
        {!union.unionCadres || union.unionCadres.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 font-medium bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            {locale === 'ta' ? 'இந்த அமைப்பு அலகிற்கு இதுவரை நிர்வாகிகள் பதிவு செய்யப்படவில்லை.' : 'No administrators registered for this org unit yet.'}
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {(union.unionCadres || []).map((cadre, index) => {
              const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || 'Member';
              const isSecretary = rawRole.toUpperCase().includes('SECRETARY') || rawRole.toUpperCase().includes('PRESIDENT');
              const highlight = index === 0 && isSecretary;

              return (
                <CadreCard
                  key={cadre.id || index}
                  cadre={cadre}
                  highlight={highlight}
                  minWidth="240px"
                  showLocation={true}
                  onView={(c) => setViewingCadre(c)}
                  onEdit={(e, c) => handleOpenEdit(e, c)}
                  onDelete={(e, id) => handleDelete(e, id)}
                  onCall={(person) => setCallConfirmation(person)}
                />
              );
            })}
          </div>
        )}
      </div>

      
      <CadreFormDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingId={editingId}
        cadres={union.unionCadres}
        defaultLevel="UNION"
        lockLevel={true}
        defaultUnionId={union.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['unions', id] });
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
                      queryClient.invalidateQueries({ queryKey: ['unions', union?.id] });
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
