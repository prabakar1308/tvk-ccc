'use client';

import { useState } from 'react';
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
import { Search, Plus, MapPin, Edit2, Trash2, Building2, Building, Store, LayoutGrid, List, Phone, Users, X, ShieldCheck, UserCheck, Layers } from "lucide-react";
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUnions, useCreateUnion, useUpdateUnion, useDeleteUnion } from '@/hooks/use-unions';
import { useDistricts } from '@/hooks/use-districts';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { PanchayatMultiSelect } from '@/components/shared/panchayat-multi-select';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getOrgUnitName, getUnitTypeLabel, getAreasCoveredLabel, getGroupAreasCoveredLabel } from '@/lib/org-unit-translations';
import { translatePersonNameToTamil } from '@/lib/name-translations';

export default function UnionsPage() {
  const locale = useLocale();
  const t = useTranslations('Unions');
  const tCommon = useTranslations('Common');
  const tForms = useTranslations('Forms');
  const { data: unions, isLoading } = useUnions();
  const { data: districts } = useDistricts();
  const createMutation = useCreateUnion();
  const updateMutation = useUpdateUnion();
  const deleteMutation = useDeleteUnion();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unitTypeFilter, setUnitTypeFilter] = useState('ALL');
  const [viewType, setViewType] = useState<'TABLE' | 'TILE'>('TILE');
  const [callPerson, setCallPerson] = useState<{ name: string; phone: string } | null>(null);

  const handleInitiateCall = (phone: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCallPerson({ phone, name });
  };
  
  const [formData, setFormData] = useState<{
    name: string;
    group: string;
    unitType: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    areasCovered: string[];
  }>({
    name: '',
    group: 'KURINJIPADI',
    unitType: 'UNION',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    areasCovered: []
  });
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', group: 'KURINJIPADI', unitType: 'UNION', contactName: '', contactPhone: '', contactEmail: '', areasCovered: [] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (union: any) => {
    setEditingId(union.id);
    setFormData({
      name: union.name || '',
      group: union.group || 'KURINJIPADI',
      unitType: union.unitType || 'UNION',
      contactName: union.contactName || '',
      contactPhone: union.contactPhone || '',
      contactEmail: union.contactEmail || '',
      areasCovered: union.areasCovered || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const filteredUnions = unions?.filter((union: any) => {
    const matchesSearch = union.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnitType = unitTypeFilter === 'ALL' || union.unitType === unitTypeFilter;
    return matchesSearch && matchesUnitType;
  }).sort((a: any, b: any) => {
    const typeOrder: Record<string, number> = { 'UNION': 1, 'TOWN': 2, 'TOWN_PANCHAYAT': 3, 'AREA': 4 };
    const orderA = typeOrder[a.unitType || 'UNION'] || 99;
    const orderB = typeOrder[b.unitType || 'UNION'] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold uppercase tracking-wide text-primary">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">{t('description')}</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger 
            render={
              <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95" />
            }
          >
            <Plus className="mr-2 h-5 w-5" /> {t('addNew')}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] max-h-[85vh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-5 pb-3.5 pr-12 shrink-0 border-b border-zinc-100 dark:border-zinc-800">
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingId ? t('editUnion') : t('addNew')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1 overscroll-contain">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('unionName')} *</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group">{tForms('group')} *</Label>
                  <Select 
                    value={formData.group} 
                    onValueChange={(val) => setFormData({...formData, group: val || ''})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tForms('selectGroup')}>
                        {formData.group === 'KURINJIPADI' ? tCommon('kurinjipadi') : formData.group === 'CUDDALORE' ? tCommon('cuddalore') : formData.group || tForms('selectGroup')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KURINJIPADI">{tCommon('kurinjipadi')}</SelectItem>
                      <SelectItem value="CUDDALORE">{tCommon('cuddalore')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitType">{tForms('unitType') || 'Unit Type'} *</Label>
                  <Select 
                    value={formData.unitType} 
                    onValueChange={(val) => setFormData({...formData, unitType: val || ''})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tForms('selectUnitType') || 'Select Unit Type'}>
                        {formData.unitType === 'UNION' ? 'Union' : 
                         formData.unitType === 'TOWN' ? 'Town' : 
                         formData.unitType === 'TOWN_PANCHAYAT' ? 'Town Panchayat' : 
                         formData.unitType === 'AREA' ? 'Area' : formData.unitType || 'Select Unit Type'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNION">Union</SelectItem>
                      <SelectItem value="TOWN">Town</SelectItem>
                      <SelectItem value="TOWN_PANCHAYAT">Town Panchayat</SelectItem>
                      <SelectItem value="AREA">Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label>{getAreasCoveredLabel(formData.unitType, locale)}</Label>
                  <PanchayatMultiSelect
                    value={formData.areasCovered}
                    onChange={(val) => setFormData(prev => ({ ...prev, areasCovered: val }))}
                    displayStyle="badges"
                    placeholder={
                      (formData.unitType || 'UNION').toUpperCase() === 'UNION'
                        ? (locale === 'ta' ? 'ஊராட்சிகளைத் தேர்ந்தெடுக்கவும்...' : "Select Panchayats...")
                        : (locale === 'ta' ? 'வார்டுகளைத் தேர்ந்தெடுக்கவும்...' : "Select Wards...")
                    }
                    searchPlaceholder={
                      (formData.unitType || 'UNION').toUpperCase() === 'UNION'
                        ? (locale === 'ta' ? 'ஊராட்சிகளைத் தேடவும்...' : "Search panchayats...")
                        : (locale === 'ta' ? 'வார்டுகளைத் தேடவும்...' : "Search wards...")
                    }
                    emptyMessage={
                      (formData.unitType || 'UNION').toUpperCase() === 'UNION'
                        ? (locale === 'ta' ? 'ஊராட்சி எதுவும் கிடைக்கவில்லை.' : "No panchayat found.")
                        : (locale === 'ta' ? 'வார்டு எதுவும் கிடைக்கவில்லை.' : "No ward found.")
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">{tForms('contactName')}</Label>
                  <Input 
                    id="contactName" 
                    value={formData.contactName}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">{tForms('contactPhone')}</Label>
                  <Input 
                    id="contactPhone" 
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  />
                </div>
              </div>

              <DialogFooter className="m-0 px-6 py-4 pb-6 sm:pb-6 shrink-0 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 flex items-center justify-end gap-2 sm:gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{tCommon('cancel')}</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary hover:bg-primary/90 text-white font-semibold">
                  {editingId ? tCommon('saveChanges') : t('createUnion')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder={t('searchPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={unitTypeFilter} onValueChange={(val) => setUnitTypeFilter(val || '')}>
            <SelectTrigger className="w-full sm:w-[200px] !h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 m-0">
              <SelectValue placeholder={locale === 'ta' ? 'அனைத்து அமைப்பு வகைகள்' : 'All Unit Types'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{locale === 'ta' ? 'அனைத்து அமைப்பு வகைகள்' : 'All Unit Types'}</SelectItem>
              <SelectItem value="UNION">{locale === 'ta' ? 'ஒன்றியம்' : 'Union'}</SelectItem>
              <SelectItem value="TOWN">{locale === 'ta' ? 'நகரம்' : 'Town'}</SelectItem>
              <SelectItem value="TOWN_PANCHAYAT">{locale === 'ta' ? 'பேரூராட்சி' : 'Town Panchayat'}</SelectItem>
              <SelectItem value="AREA">{locale === 'ta' ? 'பகுதி' : 'Area'}</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setViewType(viewType === 'TABLE' ? 'TILE' : 'TABLE')}
            className="h-11 rounded-md px-4 font-medium border-primary/20 text-primary hover:bg-primary/5 shrink-0 m-0"
          >
            {viewType === 'TABLE' ? <LayoutGrid className="w-5 h-5 sm:mr-2" /> : <List className="w-5 h-5 sm:mr-2" />}
            <span className="hidden sm:inline">
              {viewType === 'TABLE' 
                ? (locale === 'ta' ? 'கட்டக் காட்சி' : 'Tile View') 
                : (locale === 'ta' ? 'பட்டியல் காட்சி' : 'Table View')}
            </span>
          </Button>
        </div>
      </div>

      {/* Data Tables Grouped */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-primary/20 shadow-sm">{t('loading')}</div>
        ) : !filteredUnions || filteredUnions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-primary/20 shadow-sm">{t('noUnions')}</div>
        ) : (
          Object.entries(
            filteredUnions.reduce((acc: any, union: any) => {
              const group = union.group || 'OTHER';
              if (!acc[group]) acc[group] = [];
              acc[group].push(union);
              return acc;
            }, {} as Record<string, any[]>) as Record<string, any[]>
          )
          .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
          .map(([groupKey, groupUnions]) => (
            <div key={groupKey} className="space-y-4">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <div className="w-2 h-6 bg-[#8F0A1B] rounded-sm"></div>
                {groupKey === 'KURINJIPADI' ? tCommon('kurinjipadi') : groupKey === 'CUDDALORE' ? tCommon('cuddalore') : groupKey}
              </h2>
              {viewType === 'TABLE' ? (
                <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-primary py-4">{t('unionName')}</TableHead>
                        <TableHead className="font-semibold text-primary py-4">{tForms('contactName')}</TableHead>
                        <TableHead className="font-semibold text-primary py-4">{tForms('phone')}</TableHead>
                        <TableHead className="font-semibold text-primary py-4">{getGroupAreasCoveredLabel(groupUnions, locale)}</TableHead>
                        <TableHead className="font-semibold text-primary py-4 text-right">{tCommon('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupUnions.map((union: any) => {
                        const secretary = union.secretary;
                        const rawContactName = secretary ? secretary.name : union.contactName;
                        const contactName = locale === 'ta' && rawContactName ? translatePersonNameToTamil(rawContactName) : rawContactName;
                        const contactPhone = secretary ? secretary.phone : union.contactPhone;

                        return (
                        <TableRow key={union.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                          <TableCell className="font-bold text-base py-4 text-foreground">
                            <Link href={`/unions/${union.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group-hover:text-primary">
                              {union.unitType === 'TOWN' ? (
                                <div className="p-2 rounded-md bg-blue-50 border border-blue-100 shadow-sm">
                                  <Building className="h-4 w-4 text-blue-600" />
                                </div>
                              ) : union.unitType === 'TOWN_PANCHAYAT' ? (
                                <div className="p-2 rounded-md bg-green-50 border border-green-100 shadow-sm">
                                  <Store className="h-4 w-4 text-green-600" />
                                </div>
                              ) : union.unitType === 'AREA' ? (
                                <div className="p-2 rounded-md bg-purple-50 border border-purple-100 shadow-sm">
                                  <MapPin className="h-4 w-4 text-purple-600" />
                                </div>
                              ) : (
                                <div className="p-2 rounded-md bg-orange-50 border border-orange-100 shadow-sm">
                                  <Building2 className="h-4 w-4 text-orange-600" />
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span>{getOrgUnitName(union, locale)}</span>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                                  {getUnitTypeLabel(union.unitType, locale)}
                                </span>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="py-4 font-medium">
                            <div className="flex flex-col">
                              <span>{contactName || '-'}</span>
                              {secretary && (
                                <span className="text-[10px] text-[#8F0A1B] uppercase font-bold">
                                  {locale === 'ta' ? 'செயலாளர்' : 'Secretary'}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 font-medium text-muted-foreground">
                            {contactPhone ? (
                              <button onClick={(e) => handleInitiateCall(contactPhone, contactName || '', e)} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md text-sm">
                                <Phone className="w-3.5 h-3.5" />
                                {contactPhone}
                              </button>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="py-4">
                            {union.areasCovered && union.areasCovered.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-[320px] items-center">
                                {union.areasCovered.map((area: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center text-[11px] font-medium bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60 rounded-md px-2 py-0.5 shadow-2xs">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <div className="flex justify-end gap-2 transition-opacity">
                              <Button onClick={() => handleOpenEdit(union)} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button onClick={() => handleDelete(union.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 p-1">
                  {groupUnions.map((union: any) => {
                    const secretary = union.secretary;
                    const rawContactName = secretary ? secretary.name : union.contactName;
                    const contactName = locale === 'ta' && rawContactName ? translatePersonNameToTamil(rawContactName) : rawContactName;
                    const contactPhone = secretary ? secretary.phone : union.contactPhone;
                    const contactPhoto = secretary?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName || 'U')}&background=8F0A1B&color=fff&size=128`;

                    // Theme by unit type
                    const unitBadgeTheme = 
                      union.unitType === 'TOWN' 
                        ? { bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40', dot: 'bg-blue-500' }
                        : union.unitType === 'TOWN_PANCHAYAT'
                        ? { bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40', dot: 'bg-emerald-500' }
                        : union.unitType === 'AREA'
                        ? { bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/40', dot: 'bg-purple-500' }
                        : { bg: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200/60 dark:border-orange-900/40', dot: 'bg-orange-500' };

                    const unitIconTheme =
                      union.unitType === 'TOWN' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40' 
                        : union.unitType === 'TOWN_PANCHAYAT' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40' 
                        : union.unitType === 'AREA' 
                        ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40' 
                        : 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/40';

                    return (
                    <div 
                      key={union.id} 
                      className="group relative flex flex-col h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-sm hover:shadow-xl hover:shadow-[#8F0A1B]/6 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all duration-300 overflow-hidden hover:-translate-y-1"
                    >
                      {/* Ambient Accent Glow & Top Line */}
                      <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 opacity-30 transition-all duration-500 pointer-events-none" />
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] via-[#D97706] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Desktop Action Buttons Overlay (Top-Right on Hover) */}
                      <div className="hidden md:flex absolute top-3.5 right-3.5 items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0 z-10">
                        <Button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEdit(union); }} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-500 hover:text-[#8F0A1B] hover:bg-[#8F0A1B]/10 rounded-full transition-colors bg-white/80 dark:bg-zinc-800/80 shadow-xs border border-zinc-200/50 dark:border-zinc-700/50"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(union.id); }} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-full transition-colors bg-white/80 dark:bg-zinc-800/80 shadow-xs border border-zinc-200/50 dark:border-zinc-700/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      
                      <Link href={`/unions/${union.id}`} className="flex-1 flex flex-col cursor-pointer p-5 pb-4 md:pb-5">
                        
                        {/* Header Section */}
                        <div className="flex items-start gap-3.5 mb-4 pr-0 md:pr-16">
                          <div className={`w-11 h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center border transition-transform group-hover:scale-105 duration-300 ${unitIconTheme}`}>
                            {union.unitType === 'TOWN' ? <Building className="h-5 w-5" /> :
                             union.unitType === 'TOWN_PANCHAYAT' ? <Store className="h-5 w-5" /> :
                             union.unitType === 'AREA' ? <MapPin className="h-5 w-5" /> :
                             <Building2 className="h-5 w-5" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-[17px] sm:text-[18px] text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors line-clamp-2 md:line-clamp-1 mb-1.5 break-words">
                              {getOrgUnitName(union, locale)}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-xs ${unitBadgeTheme.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${unitBadgeTheme.dot}`}></span>
                              {getUnitTypeLabel(union.unitType, locale)}
                            </span>
                          </div>
                        </div>

                        {/* Leader / Secretary Executive Badge */}
                        <div className="flex-1 flex flex-col justify-center my-1">
                          {(contactName || contactPhone) ? (
                            <div className="flex items-center justify-between gap-3.5 bg-gradient-to-br from-zinc-50/90 to-white dark:from-zinc-900/90 dark:to-zinc-950/80 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 group-hover:border-[#8F0A1B]/25 dark:group-hover:border-[#8F0A1B]/40 transition-colors shadow-xs">
                              <div className="flex flex-col flex-1 min-w-0 pr-1">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase ${
                                    secretary 
                                      ? 'bg-[#8F0A1B]/10 text-[#8F0A1B] dark:bg-[#8F0A1B]/25 dark:text-red-300' 
                                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                  }`}>
                                    {secretary ? <ShieldCheck className="w-3 h-3 text-[#8F0A1B] dark:text-red-400" /> : <UserCheck className="w-3 h-3 text-zinc-500" />}
                                    {secretary ? (locale === 'ta' ? 'செயலாளர்' : 'Secretary') : (locale === 'ta' ? 'தொடர்பு நபர்' : 'Contact Person')}
                                  </span>
                                </div>
                                <h4 className="text-[15px] sm:text-[16px] font-bold text-zinc-900 dark:text-zinc-100 truncate leading-snug mb-2 group-hover:text-[#8F0A1B] transition-colors">
                                  {contactName}
                                </h4>
                                {contactPhone ? (
                                  <button 
                                    onClick={(e) => handleInitiateCall(contactPhone, contactName || '', e)} 
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-xs w-max group/phone"
                                  >
                                    <Phone className="w-3 h-3 group-hover/phone:animate-bounce" />
                                    <span>{contactPhone}</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-zinc-400 italic">{locale === 'ta' ? 'தொலைபேசி எண் இல்லை' : 'No phone provided'}</span>
                                )}
                              </div>
                              <div className="relative group-hover:scale-105 transition-transform duration-300 shrink-0">
                                <UserAvatar 
                                  src={secretary?.photoUrl} 
                                  name={contactName || 'Contact'} 
                                  size="xl" 
                                  shape="square" 
                                  ring="primary" 
                                  elevation="md" 
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{locale === 'ta' ? 'தலைமை' : 'Leadership'}</span>
                                <span className="text-sm font-semibold text-zinc-500 italic mt-0.5">{t('noContactProvided')}</span>
                              </div>
                              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <Users className="w-5 h-5" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Quick Stats Bar (Kilais & Cadres) */}
                        <div className="flex items-center gap-2 pt-2 text-xs">
                          <div 
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#548777] text-white font-medium shadow-xs"
                            style={{ backgroundColor: '#548777', color: 'white' }}
                          >
                            <Layers className="w-3.5 h-3.5 text-white" />
                            <span className="text-white"><strong className="text-white font-bold">{union._count?.kilais || 0}</strong> {locale === 'ta' ? 'கிளைகள்' : 'Kilais'}</span>
                          </div>
                          <div 
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#548777] text-white font-medium shadow-xs"
                            style={{ backgroundColor: '#548777', color: 'white' }}
                          >
                            <Users className="w-3.5 h-3.5 text-white" />
                            <span className="text-white"><strong className="text-white font-bold">{union._count?.cadres || 0}</strong> {locale === 'ta' ? 'நிர்வாகிகள்' : 'Cadres'}</span>
                          </div>
                        </div>
                        
                        {/* Areas Covered Section */}
                        {union.areasCovered && union.areasCovered.length > 0 && (
                          <div 
                            className="mt-3.5 text-zinc-800"
                            style={{
                              background: '#e9edec',
                              borderRadius: '15px',
                              padding: '10px 5px',
                              fontWeight: 'bold',
                            }}
                          >
                            <div 
                              className="flex items-center justify-between gap-2 mb-2"
                              style={{
                                background: '#d5dbd9',
                                borderRadius: '4px',
                                padding: '5px',
                                fontWeight: 'bold',
                              }}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                                <span className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider truncate">
                                  {getAreasCoveredLabel(union.unitType, locale)}
                                </span>
                              </div>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white text-zinc-700 border border-zinc-300/60 shrink-0">
                                {union.areasCovered.length}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 items-center px-1">
                              {union.areasCovered.map((area: string, idx: number) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center text-[11px] font-medium bg-white text-zinc-800 border border-zinc-300/60 rounded-md px-2.5 py-1 shadow-2xs"
                                >
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </Link>

                      {/* Mobile Actions Footer */}
                      <div className="flex md:hidden items-center justify-between gap-2 px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 mt-auto">
                        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          {tCommon('actions')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEdit(union); }} 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#8F0A1B] hover:border-[#8F0A1B]/40 hover:bg-[#8F0A1B]/5 rounded-lg transition-colors border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 shadow-2xs gap-1.5"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-[#8F0A1B]" />
                            <span>{tCommon('edit')}</span>
                          </Button>
                          <Button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(union.id); }} 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 shadow-2xs gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            <span>{tCommon('delete')}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CallConfirmationDialog 
        person={callPerson} 
        onOpenChange={(open) => !open && setCallPerson(null)} 
      />
    </div>
  );
}
