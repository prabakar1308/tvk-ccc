'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Building2,
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Building,
  Vote,
  Compass,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import {
  usePanchayats,
  useCreatePanchayat,
  useUpdatePanchayat,
  useDeletePanchayat,
} from '@/hooks/use-panchayats';
import {
  useVillages,
  useCreateVillage,
  useUpdateVillage,
  useDeleteVillage,
} from '@/hooks/use-villages';
import { useUnions } from '@/hooks/use-unions';
import { Panchayat, CreatePanchayatDto } from '@/services/api/panchayats';
import { Village, CreateVillageDto } from '@/services/api/villages';

export function MasterDataTab() {
  const locale = useLocale();

  // Active sub-view: 'panchayats' | 'villages'
  const [subView, setSubView] = useState<'panchayats' | 'villages'>('panchayats');

  // Filters
  const [selectedUnionId, setSelectedUnionId] = useState<string>('all');
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const { data: unions = [], isLoading: isLoadingUnions } = useUnions();
  const effectiveUnionId = selectedUnionId !== 'all' ? selectedUnionId : undefined;
  const { data: panchayats = [], isLoading: isLoadingPanchayats } = usePanchayats(effectiveUnionId);

  const effectivePanchayatId = selectedPanchayatId !== 'all' ? selectedPanchayatId : undefined;
  const { data: villages = [], isLoading: isLoadingVillages } = useVillages(effectivePanchayatId);

  // Mutations
  const createPanchayat = useCreatePanchayat();
  const updatePanchayat = useUpdatePanchayat();
  const deletePanchayat = useDeletePanchayat();

  const createVillage = useCreateVillage();
  const updateVillage = useUpdateVillage();
  const deleteVillage = useDeleteVillage();

  // Dialog States - Panchayat
  const [isPanchayatDialogOpen, setIsPanchayatDialogOpen] = useState(false);
  const [editingPanchayat, setEditingPanchayat] = useState<Panchayat | null>(null);
  const [panchayatForm, setPanchayatForm] = useState<CreatePanchayatDto>({
    name: '',
    nameTa: '',
    unionId: '',
    type: 'VILLAGE_PANCHAYAT',
    wardNumber: undefined,
    description: '',
  });

  // Dialog States - Village
  const [isVillageDialogOpen, setIsVillageDialogOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [villageUnionFilter, setVillageUnionFilter] = useState<string>('');
  const [villageForm, setVillageForm] = useState<CreateVillageDto>({
    name: '',
    nameTa: '',
    panchayatId: '',
    centerLat: undefined,
    centerLng: undefined,
    description: '',
  });

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'panchayat' | 'village';
    id: string;
    name: string;
  } | null>(null);

  // Filtered Panchayats
  const filteredPanchayats = useMemo(() => {
    return panchayats.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.nameTa && p.nameTa.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.wardNumber && String(p.wardNumber).includes(q));
      return matchSearch;
    });
  }, [panchayats, searchQuery]);

  // Filtered Villages
  const filteredVillages = useMemo(() => {
    return villages.filter((v) => {
      // If a union filter is active and village has panchayat.unionId
      if (selectedUnionId !== 'all' && v.panchayat && v.panchayat.unionId !== selectedUnionId) {
        return false;
      }
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        (v.nameTa && v.nameTa.toLowerCase().includes(q)) ||
        (v.code && v.code.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [villages, selectedUnionId, searchQuery]);

  // Handle open create/edit panchayat
  const handleOpenPanchayatDialog = (panchayat?: Panchayat) => {
    if (panchayat) {
      setEditingPanchayat(panchayat);
      setPanchayatForm({
        name: panchayat.name,
        nameTa: panchayat.nameTa || panchayat.name,
        unionId: panchayat.unionId,
        type: panchayat.type || 'VILLAGE_PANCHAYAT',
        wardNumber: panchayat.wardNumber || undefined,
        description: panchayat.description || '',
      });
    } else {
      setEditingPanchayat(null);
      setPanchayatForm({
        name: '',
        nameTa: '',
        unionId: selectedUnionId !== 'all' ? selectedUnionId : (unions[0]?.id || ''),
        type: 'VILLAGE_PANCHAYAT',
        wardNumber: undefined,
        description: '',
      });
    }
    setIsPanchayatDialogOpen(true);
  };

  // Handle save panchayat
  const handleSavePanchayat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panchayatForm.name.trim() || !panchayatForm.unionId) {
      return;
    }

    try {
      if (editingPanchayat) {
        await updatePanchayat.mutateAsync({
          id: editingPanchayat.id,
          data: panchayatForm,
        });
      } else {
        await createPanchayat.mutateAsync(panchayatForm);
      }
      setIsPanchayatDialogOpen(false);
    } catch (err) {
      console.error('Failed to save panchayat:', err);
    }
  };

  // Handle open create/edit village
  const handleOpenVillageDialog = (village?: Village) => {
    if (village) {
      setEditingVillage(village);
      const parentPanchayat = panchayats.find((p) => p.id === village.panchayatId);
      setVillageUnionFilter(parentPanchayat?.unionId || '');
      setVillageForm({
        name: village.name,
        nameTa: village.nameTa || village.name,
        panchayatId: village.panchayatId,
        centerLat: village.centerLat || undefined,
        centerLng: village.centerLng || undefined,
        description: village.description || '',
      });
    } else {
      setEditingVillage(null);
      const defaultUnion = selectedUnionId !== 'all' ? selectedUnionId : (unions[0]?.id || '');
      setVillageUnionFilter(defaultUnion);
      const defaultPanchayat =
        selectedPanchayatId !== 'all'
          ? selectedPanchayatId
          : panchayats.find((p) => !defaultUnion || p.unionId === defaultUnion)?.id || '';
      setVillageForm({
        name: '',
        nameTa: '',
        panchayatId: defaultPanchayat,
        centerLat: undefined,
        centerLng: undefined,
        description: '',
      });
    }
    setIsVillageDialogOpen(true);
  };

  // Handle save village
  const handleSaveVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageForm.name.trim() || !villageForm.panchayatId) {
      return;
    }

    try {
      if (editingVillage) {
        await updateVillage.mutateAsync({
          id: editingVillage.id,
          data: villageForm,
        });
      } else {
        await createVillage.mutateAsync(villageForm);
      }
      setIsVillageDialogOpen(false);
    } catch (err) {
      console.error('Failed to save village:', err);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'panchayat') {
        await deletePanchayat.mutateAsync(deleteTarget.id);
      } else {
        await deleteVillage.mutateAsync(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Panchayats available for village form dialog dropdown
  const dialogPanchayats = useMemo(() => {
    if (!villageUnionFilter) return panchayats;
    return panchayats.filter((p) => p.unionId === villageUnionFilter);
  }, [panchayats, villageUnionFilter]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      {/* Overview Banner Card */}
      <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-gradient-to-br from-white via-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950">
        <CardHeader className="bg-gradient-to-r from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8F0A1B] to-[#B81930] text-white flex items-center justify-center shadow-xs shrink-0">
                <Layers className="w-5 h-5 text-[#FFC72C]" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <span>{locale === 'ta' ? 'பிரதேச முதன்மை தரவு மேலாண்மை' : 'Territory Master Data Management'}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {locale === 'ta'
                    ? 'ஊராட்சிகள், வார்டுகள் மற்றும் கிராமங்கள் / குடியிருப்புகளை நிர்வகிக்கவும்'
                    : 'Manage Panchayats, Wards, and Village/Hamlet boundaries across all administrative units'}
                </CardDescription>
              </div>
            </div>

            {/* Sub-View Switcher Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/60 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSubView('panchayats')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  subView === 'panchayats'
                    ? 'bg-gradient-to-r from-[#8F0A1B] to-[#B81930] text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>{locale === 'ta' ? 'ஊராட்சிகள் & வார்டுகள்' : 'Panchayats & Wards'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                  subView === 'panchayats' ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}>
                  {panchayats.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubView('villages')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  subView === 'villages'
                    ? 'bg-gradient-to-r from-[#8F0A1B] to-[#B81930] text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{locale === 'ta' ? 'கிராமங்கள் & குடியிருப்புகள்' : 'Villages & Hamlets'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                  subView === 'villages' ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}>
                  {villages.length}
                </span>
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Filter and Action Bar */}
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Bar */}
              <div className="relative min-w-[200px] flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={
                    subView === 'panchayats'
                      ? (locale === 'ta' ? 'ஊராட்சி / வார்டைத் தேடுங்கள்...' : 'Search panchayat or ward...')
                      : (locale === 'ta' ? 'கிராமத்தைத் தேடுங்கள்...' : 'Search village or hamlet...')
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>

              {/* Union Filter Dropdown */}
              <div className="w-[180px] sm:w-[210px]">
                <Select
                  value={selectedUnionId}
                  onValueChange={(val) => {
                    const uId = val || 'all';
                    setSelectedUnionId(uId);
                    if (uId === 'all') {
                      setSelectedPanchayatId('all');
                    }
                  }}
                >
                  <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm font-medium">
                    <SelectValue placeholder={locale === 'ta' ? 'அனைத்து ஒன்றியங்கள்' : 'All Unions'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">
                      {locale === 'ta' ? '🌐 அனைத்து ஒன்றியங்கள்' : '🌐 All Unions'}
                    </SelectItem>
                    {unions.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {locale === 'ta' && u.nameTa ? `${u.nameTa} (${u.name})` : u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Panchayat Filter Dropdown (Only for Villages sub-view) */}
              {subView === 'villages' && (
                <div className="w-[180px] sm:w-[220px]">
                  <Select
                    value={selectedPanchayatId}
                    onValueChange={(val) => setSelectedPanchayatId(val || 'all')}
                  >
                    <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm font-medium">
                      <SelectValue placeholder={locale === 'ta' ? 'அனைத்து ஊராட்சிகள்' : 'All Panchayats'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="all">
                        {locale === 'ta' ? '🏛️ அனைத்து ஊராட்சிகள்' : '🏛️ All Panchayats'}
                      </SelectItem>
                      {panchayats.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {locale === 'ta' && p.nameTa ? `${p.nameTa} (${p.name})` : p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Right Add Button */}
            <div className="shrink-0 flex items-center gap-2">
              {subView === 'panchayats' ? (
                <Button
                  onClick={() => handleOpenPanchayatDialog()}
                  className="bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white font-bold h-10 px-4 rounded-xl shadow-xs transition-transform active:scale-95 text-xs sm:text-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{locale === 'ta' ? 'புதிய ஊராட்சி / வார்டு' : 'Add Panchayat / Ward'}</span>
                </Button>
              ) : (
                <Button
                  onClick={() => handleOpenVillageDialog()}
                  className="bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white font-bold h-10 px-4 rounded-xl shadow-xs transition-transform active:scale-95 text-xs sm:text-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{locale === 'ta' ? 'புதிய கிராமம் / குடியிருப்பு' : 'Add Village / Hamlet'}</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: PANCHAYATS & WARDS TABLE */}
      {/* ========================================================================= */}
      {subView === 'panchayats' && (
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                  <th className="py-3 px-4">{locale === 'ta' ? 'பெயர் / தமிழ் பெயர்' : 'Name / Tamil'}</th>
                  <th className="py-3 px-4">{locale === 'ta' ? 'வகை' : 'Type'}</th>
                  <th className="py-3 px-4">{locale === 'ta' ? 'ஒன்றியம் / பகுதி' : 'Union / Unit'}</th>
                  <th className="py-3 px-4 text-center">{locale === 'ta' ? 'வார்டு எண்' : 'Ward No'}</th>
                  <th className="py-3 px-4 text-center">{locale === 'ta' ? 'கிராமங்கள்' : 'Villages'}</th>
                  <th className="py-3 px-4 text-center">{locale === 'ta' ? 'கிளைகள்' : 'Kilais'}</th>
                  <th className="py-3 px-4 text-center">{locale === 'ta' ? 'வாக்குச்சாவடிகள்' : 'Booths'}</th>
                  <th className="py-3 px-4 text-right">{locale === 'ta' ? 'செயல்கள்' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {isLoadingPanchayats ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>{locale === 'ta' ? 'ஊராட்சிகள் ஏற்றப்படுகின்றன...' : 'Loading Panchayats...'}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPanchayats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building className="w-10 h-10 text-muted-foreground/40" />
                        <span className="font-semibold text-sm">
                          {locale === 'ta' ? 'ஊராட்சிகள் எதுவும் கிடைக்கவில்லை' : 'No Panchayats or Wards found'}
                        </span>
                        <span className="text-xs">
                          {locale === 'ta' ? 'வடிகட்டிகளை மாற்றவும் அல்லது புதிய ஒன்றை உருவாக்கவும்.' : 'Try adjusting search or add a new record.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPanchayats.map((p) => {
                    const typeBadge =
                      p.type === 'TOWN_PANCHAYAT_WARD' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {locale === 'ta' ? 'பேரூராட்சி வார்டு' : 'Town Ward'}
                        </span>
                      ) : p.type === 'MUNICIPALITY_WARD' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {locale === 'ta' ? 'நகராட்சி வார்டு' : 'Municipality Ward'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {locale === 'ta' ? 'கிராம ஊராட்சி' : 'Village Panchayat'}
                        </span>
                      );

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                          <div className="flex flex-col">
                            <span>{p.name}</span>
                            {p.nameTa && (
                              <span className="text-xs text-muted-foreground font-normal">
                                {p.nameTa}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">{typeBadge}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {p.union?.name || '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300">
                          {p.wardNumber !== undefined && p.wardNumber !== null ? `Ward ${p.wardNumber}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPanchayatId(p.id);
                              setSubView('villages');
                            }}
                            className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full font-mono text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer transition-colors"
                            title="Filter villages by this panchayat"
                          >
                            {p._count?.villages ?? p.villages?.length ?? 0}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          {p._count?.kilais ?? p.kilais?.length ?? 0}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          {p._count?.booths ?? p.booths?.length ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenPanchayatDialog(p)}
                              className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-primary"
                              title={locale === 'ta' ? 'திருத்து' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'panchayat',
                                  id: p.id,
                                  name: `${p.name} (${p.nameTa || ''})`,
                                })
                              }
                              className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-500 hover:text-red-600"
                              title={locale === 'ta' ? 'நீக்கு' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: VILLAGES & HAMLETS TABLE */}
      {/* ========================================================================= */}
      {subView === 'villages' && (
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                  <th className="py-3 px-4">{locale === 'ta' ? 'கிராமம் / குடியிருப்பு பெயர்' : 'Village / Hamlet'}</th>
                  <th className="py-3 px-4">{locale === 'ta' ? 'தாய் ஊராட்சி / வார்டு' : 'Parent Panchayat / Ward'}</th>
                  <th className="py-3 px-4">{locale === 'ta' ? 'ஒன்றியம்' : 'Union'}</th>
                  <th className="py-3 px-4 text-center">{locale === 'ta' ? 'புவியியல் அமைவிடம்' : 'Coordinates'}</th>
                  <th className="py-3 px-4 text-center">{locale === 'ta' ? 'கிளைகள்' : 'Kilais'}</th>
                  <th className="py-3 px-4 text-center">{locale === 'ta' ? 'வாக்குச்சாவடிகள்' : 'Booths'}</th>
                  <th className="py-3 px-4 text-right">{locale === 'ta' ? 'செயல்கள்' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {isLoadingVillages ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>{locale === 'ta' ? 'கிராமங்கள் ஏற்றப்படுகின்றன...' : 'Loading Villages...'}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredVillages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <MapPin className="w-10 h-10 text-muted-foreground/40" />
                        <span className="font-semibold text-sm">
                          {locale === 'ta' ? 'கிராமங்கள் எதுவும் கிடைக்கவில்லை' : 'No Villages or Hamlets found'}
                        </span>
                        <span className="text-xs">
                          {locale === 'ta' ? 'வடிகட்டிகளை மாற்றவும் அல்லது புதிய ஒன்றை உருவாக்கவும்.' : 'Try adjusting search or add a new village.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVillages.map((v) => {
                    const parentPanchayat = v.panchayat || panchayats.find((p) => p.id === v.panchayatId);

                    return (
                      <tr
                        key={v.id}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                          <div className="flex flex-col">
                            <span>{v.name}</span>
                            {v.nameTa && (
                              <span className="text-xs text-muted-foreground font-normal">
                                {v.nameTa}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {parentPanchayat?.name || '-'}
                          </span>
                          {parentPanchayat?.nameTa && (
                            <span className="text-xs text-muted-foreground block">
                              {parentPanchayat.nameTa}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {parentPanchayat?.union?.name ||
                            unions.find((u: any) => u.id === parentPanchayat?.unionId)?.name ||
                            '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          {v.centerLat && v.centerLng ? `${v.centerLat.toFixed(3)}, ${v.centerLng.toFixed(3)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {v._count?.kilais ?? v.kilais?.length ?? 0}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {v._count?.booths ?? v.booths?.length ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenVillageDialog(v)}
                              className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-primary"
                              title={locale === 'ta' ? 'திருத்து' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'village',
                                  id: v.id,
                                  name: `${v.name} (${v.nameTa || ''})`,
                                })
                              }
                              className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-500 hover:text-red-600"
                              title={locale === 'ta' ? 'நீக்கு' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 1: PANCHAYAT / WARD CREATE & EDIT */}
      {/* ========================================================================= */}
      <Dialog open={isPanchayatDialogOpen} onOpenChange={setIsPanchayatDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <span>
                {editingPanchayat
                  ? (locale === 'ta' ? 'ஊராட்சி / வார்டைத் திருத்து' : 'Edit Panchayat / Ward')
                  : (locale === 'ta' ? 'புதிய ஊராட்சி / வார்டு சேர்க்க' : 'Add New Panchayat / Ward')}
              </span>
            </DialogTitle>
            <DialogDescription>
              {locale === 'ta'
                ? 'ஊராட்சி அல்லது வார்டின் விவரங்களை உள்ளிடவும்.'
                : 'Enter details for the Village Panchayat or Town/Municipality Ward.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePanchayat} className="space-y-4 pt-2">
            {/* Union Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'ஒன்றியம் *' : 'Union / Town Unit *'}
              </Label>
              <Select
                value={panchayatForm.unionId}
                onValueChange={(val) => setPanchayatForm({ ...panchayatForm, unionId: val || '' })}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={locale === 'ta' ? 'ஒன்றியத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Union'} />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {unions.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {locale === 'ta' && u.nameTa ? `${u.nameTa} (${u.name})` : u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'பிரதேச வகை *' : 'Territory Type *'}
              </Label>
              <Select
                value={panchayatForm.type}
                onValueChange={(val: any) => setPanchayatForm({ ...panchayatForm, type: val || 'VILLAGE_PANCHAYAT' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VILLAGE_PANCHAYAT">
                    {locale === 'ta' ? 'கிராம ஊராட்சி (Village Panchayat)' : 'Village Panchayat'}
                  </SelectItem>
                  <SelectItem value="TOWN_PANCHAYAT_WARD">
                    {locale === 'ta' ? 'பேரூராட்சி வார்டு (Town Panchayat Ward)' : 'Town Panchayat Ward'}
                  </SelectItem>
                  <SelectItem value="MUNICIPALITY_WARD">
                    {locale === 'ta' ? 'நகராட்சி வார்டு (Municipality Ward)' : 'Municipality Ward'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ward Number (if Town/Municipality Ward) */}
            {panchayatForm.type !== 'VILLAGE_PANCHAYAT' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === 'ta' ? 'வார்டு எண் *' : 'Ward Number *'}
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={panchayatForm.wardNumber ?? ''}
                  onChange={(e) =>
                    setPanchayatForm({
                      ...panchayatForm,
                      wardNumber: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  placeholder="e.g. 1, 2, 15"
                  required
                />
              </div>
            )}

            {/* Name (English) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'பெயர் (ஆங்கிலம்) *' : 'Name (English) *'}
              </Label>
              <Input
                value={panchayatForm.name}
                onChange={(e) => setPanchayatForm({ ...panchayatForm, name: e.target.value })}
                placeholder="e.g. Karaikadu or Ward 1"
                required
              />
            </div>

            {/* Name (Tamil) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'பெயர் (தமிழ்) *' : 'Name (Tamil) *'}
              </Label>
              <Input
                value={panchayatForm.nameTa}
                onChange={(e) => setPanchayatForm({ ...panchayatForm, nameTa: e.target.value })}
                placeholder="எ.கா. காரைக்காடு அல்லது வார்டு 1"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'விளக்கம் / குறிப்பு' : 'Description / Notes'}
              </Label>
              <Input
                value={panchayatForm.description || ''}
                onChange={(e) => setPanchayatForm({ ...panchayatForm, description: e.target.value })}
                placeholder="Optional notes"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPanchayatDialogOpen(false)}
              >
                {locale === 'ta' ? 'ரத்து' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={createPanchayat.isPending || updatePanchayat.isPending}
                className="bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white font-bold"
              >
                {createPanchayat.isPending || updatePanchayat.isPending ? (
                  locale === 'ta' ? 'சேமிக்கிறது...' : 'Saving...'
                ) : (
                  locale === 'ta' ? 'சேமி' : 'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 2: VILLAGE / HAMLET CREATE & EDIT */}
      {/* ========================================================================= */}
      <Dialog open={isVillageDialogOpen} onOpenChange={setIsVillageDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span>
                {editingVillage
                  ? (locale === 'ta' ? 'கிராமத்தைத் திருத்து' : 'Edit Village / Hamlet')
                  : (locale === 'ta' ? 'புதிய கிராமம் / குடியிருப்பு சேர்க்க' : 'Add New Village / Hamlet')}
              </span>
            </DialogTitle>
            <DialogDescription>
              {locale === 'ta'
                ? 'ஊராட்சியின் கீழ் உள்ள கிராமம் அல்லது குடியிருப்பின் விவரங்களை உள்ளிடவும்.'
                : 'Enter details for the village or hamlet habitation under the selected Panchayat.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVillage} className="space-y-4 pt-2">
            {/* Filter Panchayat by Union */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'ஒன்றியத்தின் மூலம் வடிகட்டவும்' : 'Filter by Union'}
              </Label>
              <Select
                value={villageUnionFilter}
                onValueChange={(val) => {
                  const uVal = val || '';
                  setVillageUnionFilter(uVal);
                  // Auto-select first panchayat of this union
                  const matched = panchayats.find((p) => p.unionId === uVal);
                  if (matched) {
                    setVillageForm({ ...villageForm, panchayatId: matched.id });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={locale === 'ta' ? 'அனைத்து ஒன்றியங்கள்' : 'All Unions'} />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {unions.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {locale === 'ta' && u.nameTa ? `${u.nameTa} (${u.name})` : u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parent Panchayat Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'தாய் ஊராட்சி / வார்டு *' : 'Parent Panchayat / Ward *'}
              </Label>
              <Select
                value={villageForm.panchayatId}
                onValueChange={(val) => setVillageForm({ ...villageForm, panchayatId: val || '' })}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={locale === 'ta' ? 'ஊராட்சியைத் தேர்ந்தெடுக்கவும்' : 'Select Panchayat'} />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {dialogPanchayats.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {locale === 'ta' && p.nameTa ? `${p.nameTa} (${p.name})` : p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name (English) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'கிராம பெயர் (ஆங்கிலம்) *' : 'Village Name (English) *'}
              </Label>
              <Input
                value={villageForm.name}
                onChange={(e) => setVillageForm({ ...villageForm, name: e.target.value })}
                placeholder="e.g. Karaikadu South"
                required
              />
            </div>

            {/* Name (Tamil) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'கிராம பெயர் (தமிழ்) *' : 'Village Name (Tamil) *'}
              </Label>
              <Input
                value={villageForm.nameTa}
                onChange={(e) => setVillageForm({ ...villageForm, nameTa: e.target.value })}
                placeholder="எ.கா. காரைக்காடு தெற்கு"
                required
              />
            </div>

            {/* Coordinates (Optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === 'ta' ? 'அட்சரேகை (Lat)' : 'Latitude'}
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={villageForm.centerLat ?? ''}
                  onChange={(e) =>
                    setVillageForm({
                      ...villageForm,
                      centerLat: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="11.564"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === 'ta' ? 'தீர்க்கரேகை (Lng)' : 'Longitude'}
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={villageForm.centerLng ?? ''}
                  onChange={(e) =>
                    setVillageForm({
                      ...villageForm,
                      centerLng: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="79.682"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'விளக்கம் / குடியிருப்புகள்' : 'Description / Hamlets'}
              </Label>
              <Input
                value={villageForm.description || ''}
                onChange={(e) => setVillageForm({ ...villageForm, description: e.target.value })}
                placeholder="e.g. Main village and adjoining colony"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVillageDialogOpen(false)}
              >
                {locale === 'ta' ? 'ரத்து' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={createVillage.isPending || updateVillage.isPending}
                className="bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white font-bold"
              >
                {createVillage.isPending || updateVillage.isPending ? (
                  locale === 'ta' ? 'சேமிக்கிறது...' : 'Saving...'
                ) : (
                  locale === 'ta' ? 'சேமி' : 'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 3: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>{locale === 'ta' ? 'நீக்க உறுதிப்படுத்தவும்' : 'Confirm Deletion'}</span>
            </DialogTitle>
            <DialogDescription>
              {locale === 'ta' ? (
                <>
                  நிச்சயமாக <strong className="text-zinc-900 dark:text-zinc-100">{deleteTarget?.name}</strong> ஐ நீக்க விரும்புகிறீர்களா? இந்த நடவடிக்கை மாற்ற முடியாதது.
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100">{deleteTarget?.name}</strong>? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              {locale === 'ta' ? 'ரத்து' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletePanchayat.isPending || deleteVillage.isPending}
              onClick={handleConfirmDelete}
            >
              {deletePanchayat.isPending || deleteVillage.isPending ? (
                locale === 'ta' ? 'நீக்குகிறது...' : 'Deleting...'
              ) : (
                locale === 'ta' ? 'நீக்கு' : 'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
