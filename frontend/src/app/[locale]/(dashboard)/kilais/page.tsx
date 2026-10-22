'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Search, Eye, Building2, Plus, Edit2, Trash2, Check, ChevronsUpDown, X, Download, Upload, PhoneCall, LayoutGrid, List, MapPin, Store, Users, Layers, ShieldCheck } from "lucide-react";
import { UserAvatar } from '@/components/ui/user-avatar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useKilais, useCreateKilai, useUpdateKilai, useDeleteKilai } from '@/hooks/use-kilais';
import { useUnions } from '@/hooks/use-unions';
import { useBooths, useBoothAreas } from '@/hooks/use-booths';
import { CreateKilaiDto } from '@/services/api/kilais';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { getOrgUnitName } from '@/lib/org-unit-translations';
import { translatePersonNameToTamil } from '@/lib/name-translations';

export default function KilaisPage() {
  const locale = useLocale();
  const t = useTranslations('Kilais');
  const tCommon = useTranslations('Common');
  const tForms = useTranslations('Forms');
  const { data: kilais, isLoading } = useKilais();
  const { data: unions } = useUnions();
  const { data: booths } = useBooths();
  const { data: areas } = useBoothAreas();

  const createMutation = useCreateKilai();
  const updateMutation = useUpdateKilai();
  const deleteMutation = useDeleteKilai();

  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const [selectedUnion, setSelectedUnion] = useState<string>(searchParams.get('union') || 'all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [callConfirmation, setCallConfirmation] = useState<{name: string, phone: string} | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'tile'>('tile');

  const initialFormData: CreateKilaiDto = {
    name: '',
    secretaryName: '',
    panchayat: '',
    description: '',
    unionId: '',
    villages: [],
    address: '',
    pincode: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    linkedBooths: []
  };

  const [formData, setFormData] = useState<CreateKilaiDto>(initialFormData);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (kilai: any) => {
    setEditingId(kilai.id);
    setFormData({
      name: kilai.name || '',
      secretaryName: kilai.secretaryName || '',
      panchayat: kilai.panchayat || '',
      description: kilai.description || '',
      unionId: kilai.unionId ? String(kilai.unionId) : '',
      villages: kilai.villages || [],
      address: kilai.address || '',
      pincode: kilai.pincode || '',
      phone: kilai.phone || '',
      email: kilai.email || '',
      status: kilai.status || 'ACTIVE',
      linkedBooths: kilai.booths ? kilai.booths.map((b: any) => String(b.id || b._id)) : []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unionId) {
      alert(t('selectUnionAlert'));
      return;
    }
    
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

  const filteredKilais = useMemo(() => {
    if (!kilais) return [];
    
    const filtered = kilais.filter((kilai) => {
      const matchesSearch = kilai.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUnion = selectedUnion === 'all' || kilai.unionId === selectedUnion;
      
      return matchesSearch && matchesUnion;
    });
    
    return filtered.sort((a, b) => {
      const pA = (a.panchayat || '').toLowerCase();
      const pB = (b.panchayat || '').toLowerCase();
      const panchayatCompare = pA.localeCompare(pB, 'ta');
      
      if (panchayatCompare !== 0) return panchayatCompare;
      
      const nA = (a.name || '').toLowerCase();
      const nB = (b.name || '').toLowerCase();
      return nA.localeCompare(nB, 'ta');
    });
  }, [kilais, searchQuery, selectedUnion]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold uppercase tracking-wide text-primary">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">{t('description')}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 h-11 px-6 rounded-lg" asChild>
            <Link href="/kilais/import">
              <Upload className="mr-2 h-4 w-4" /> Import Kilai List
            </Link>
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger 
              render={
                <Button 
                  onClick={handleOpenCreate} 
                  className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95" 
                />
              }
            >
              <Plus className="mr-2 h-5 w-5" /> {t('addNew')}
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? t('editKilai') : t('addNew')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('kilaiName')} *</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretaryName">Secretary Name</Label>
                <Input 
                  id="secretaryName" 
                  value={formData.secretaryName || ''}
                  onChange={(e) => setFormData({...formData, secretaryName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panchayat">Panchayat</Label>
                <Input 
                  id="panchayat" 
                  value={formData.panchayat || ''}
                  onChange={(e) => setFormData({...formData, panchayat: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unionId">{t('union')} *</Label>
                <Select 
                  value={formData.unionId} 
                  onValueChange={(val) => setFormData({...formData, unionId: val || ''})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectUnion')}>
                      {formData.unionId 
                        ? unions?.find((u: any) => String(u.id || u._id) === formData.unionId)?.name || t('selectUnion')
                        : t('selectUnion')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {unions?.map((u: any) => (
                      <SelectItem key={u.id || u._id} value={String(u.id || u._id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex flex-col">
                <Label>{t('linkedBooths')}</Label>
                <Popover>
                  <PopoverTrigger className="flex h-auto min-h-11 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground font-normal">
                      <div className="flex flex-wrap gap-1 items-center">
                        {formData.linkedBooths && formData.linkedBooths.length > 0 ? (
                          formData.linkedBooths.map((boothId) => {
                            const booth = booths?.find((b: any) => String(b.id || b._id) === String(boothId));
                            return (
                              <div
                                key={boothId}
                                className="bg-primary/10 text-primary text-xs rounded-md px-2 py-1 flex items-center gap-1"
                              >
                                {booth ? `${booth.boothNo} - ${booth.area || booth.name}` : boothId}
                                <div
                                  className="cursor-pointer hover:bg-primary/20 rounded-full p-0.5"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setFormData({
                                      ...formData,
                                      linkedBooths: formData.linkedBooths?.filter((id) => id !== boothId)
                                    });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-muted-foreground">{t('selectBooths')}</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] sm:w-[375px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t('searchBooths')} />
                      <CommandList>
                        <CommandEmpty>{t('noBoothFound')}</CommandEmpty>
                        <CommandGroup>
                          {booths?.map((booth: any) => {
                            const isSelected = formData.linkedBooths?.includes(String(booth.id || booth._id));
                            return (
                              <CommandItem
                                key={booth.id || booth._id}
                                value={`${booth.boothNo} ${booth.name}`}
                                onSelect={() => {
                                  const id = String(booth.id || booth._id);
                                  const current = formData.linkedBooths || [];
                                  setFormData({
                                    ...formData,
                                    linkedBooths: isSelected
                                      ? current.filter((b) => b !== id)
                                      : [...current, id]
                                  });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {booth.boothNo} - {booth.name}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 flex flex-col">
                <Label>{t('villagesAreas')}</Label>
                <Popover>
                  <PopoverTrigger className="flex h-auto min-h-11 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground font-normal">
                      <div className="flex flex-wrap gap-1 items-center">
                        {formData.villages && formData.villages.length > 0 ? (
                          formData.villages.map((area) => (
                            <div
                              key={area}
                              className="bg-primary/10 text-primary text-xs rounded-md px-2 py-1 flex items-center gap-1"
                            >
                              {area}
                              <div
                                className="cursor-pointer hover:bg-primary/20 rounded-full p-0.5"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    villages: formData.villages?.filter((a) => a !== area)
                                  });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground">{t('selectAreas')}</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] sm:w-[375px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t('searchAreas')} />
                      <CommandList>
                        <CommandEmpty>{t('noAreaFound')}</CommandEmpty>
                        <CommandGroup>
                          {areas?.map((area: string) => {
                            const isSelected = formData.villages?.includes(area);
                            return (
                              <CommandItem
                                key={area}
                                value={area}
                                onSelect={() => {
                                  const current = formData.villages || [];
                                  setFormData({
                                    ...formData,
                                    villages: isSelected
                                      ? current.filter((a) => a !== area)
                                      : [...current, area]
                                  });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {area}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t('status')}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val: any) => setFormData({...formData, status: val})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('active')}</SelectItem>
                    <SelectItem value="INACTIVE">{t('inactive')}</SelectItem>
                    <SelectItem value="PENDING">{t('pending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{tForms('phone')}</Label>
                <Input 
                  id="phone" 
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{tCommon('cancel')}</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? tCommon('saveChanges') : t('createKilai')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder={t('searchPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto gap-4">
          <div className="w-full sm:w-64">
            <Select value={selectedUnion} onValueChange={(value) => setSelectedUnion(value || '')}>
              <SelectTrigger className="!h-11 border-primary/20 bg-zinc-50 dark:bg-zinc-900 focus:ring-primary/30 rounded-md w-full">
                <SelectValue placeholder={t('filterUnion')}>
                  {selectedUnion === 'all' 
                    ? t('allUnions') 
                    : getOrgUnitName(unions?.find((u: any) => String(u.id || u._id) === selectedUnion), locale) || t('filterUnion')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">{t('allUnions')}</SelectItem>
                {unions?.map((union: any) => (
                  <SelectItem key={union.id || union._id} value={String(union.id || union._id)}>
                    {getOrgUnitName(union, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex w-full sm:w-auto justify-center items-center bg-zinc-100 dark:bg-zinc-900 rounded-md p-1 border border-primary/10">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-sm transition-all flex items-center justify-center ${viewMode === 'table' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title={locale === 'ta' ? 'பட்டியல் காட்சி' : 'Table View'}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tile')}
              className={`p-2 rounded-sm transition-all flex items-center justify-center ${viewMode === 'tile' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title={locale === 'ta' ? 'கட்டக் காட்சி' : 'Tile View'}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-primary/20 shadow-sm">{t('loading')}</div>
        ) : !filteredKilais || filteredKilais.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-primary/20 shadow-sm">{t('noKilais')}</div>
        ) : (
          <div className="w-full">
            {viewMode === 'table' ? (
              <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-primary py-4">{t('kilaiName')}</TableHead>
                      <TableHead className="font-semibold text-primary py-4">{locale === 'ta' ? 'ஊராட்சி / பஞ்சாயத்து' : 'Panchayat'}</TableHead>
                      <TableHead className="font-semibold text-primary py-4">{locale === 'ta' ? 'செயலாளர் விவரங்கள்' : 'Secretary Details'}</TableHead>
                      <TableHead className="font-semibold text-primary py-4">{t('union')}</TableHead>
                      <TableHead className="font-semibold text-primary py-4">{t('status')}</TableHead>
                      <TableHead className="font-semibold text-primary py-4 text-right">{tCommon('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKilais.map((kilai) => {
                      const kilaiUnion = unions?.find((u: any) => String(u.id || u._id) === kilai.unionId);
                      
                      return (
                        <TableRow key={kilai.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                          <TableCell className="font-bold text-base py-4 text-foreground">
                            <Link href={`/kilais/${kilai.id}`} className="flex items-center gap-2 hover:text-[#8F0A1B] transition-colors cursor-pointer">
                              <Building2 className="h-4 w-4 text-[#8F0A1B]" />
                              {kilai.name} {kilai.tamilName && <span className="text-sm font-normal text-muted-foreground">({kilai.tamilName})</span>}
                            </Link>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="inline-flex items-center text-sm font-medium">
                              {kilai.panchayat || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            {kilai.secretaryName ? (
                              <div className="flex flex-col gap-1.5">
                                <span className="font-medium text-sm text-foreground">
                                  {locale === 'ta' ? translatePersonNameToTamil(kilai.secretaryName) : kilai.secretaryName}
                                </span>
                                {kilai.phone && (
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setCallConfirmation({ 
                                        name: locale === 'ta' && kilai.secretaryName ? translatePersonNameToTamil(kilai.secretaryName) : (kilai.secretaryName ?? ''), 
                                        phone: kilai.phone ?? '' 
                                      });
                                    }} 
                                    className="text-xs text-primary hover:text-primary/80 cursor-pointer hover:underline text-left flex items-center gap-1.5 transition-colors w-fit focus:outline-none"
                                  >
                                    <PhoneCall className="h-3 w-3" />
                                    {kilai.phone}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-secondary text-secondary-foreground shadow-sm">
                              {getOrgUnitName(kilaiUnion, locale) || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              kilai.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              kilai.status === 'INACTIVE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {kilai.status ? t(kilai.status.toLowerCase()) : t('pending')}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <div className="flex justify-end gap-2 transition-opacity">
                              <Button onClick={() => handleOpenEdit(kilai)} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button onClick={() => handleDelete(kilai.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button render={<Link href={`/kilais/${kilai.id}`} />} nativeButton={false} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                                <Eye className="h-4 w-4" />
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
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
                {filteredKilais.map((kilai) => {
                  const kilaiUnion = unions?.find((u: any) => String(u.id || u._id) === kilai.unionId);
                  const secretary = kilai.secretary;
                  const rawSecretaryName = secretary?.name || kilai.secretaryName;
                  const secretaryName = locale === 'ta' && rawSecretaryName 
                    ? translatePersonNameToTamil(rawSecretaryName) 
                    : rawSecretaryName;
                  const secretaryPhone = secretary?.phone || kilai.phone;
                  const secretaryPhoto = secretary?.photoUrl || kilai.secretaryPhoto;

                  const statusConfig = 
                    kilai.status === 'ACTIVE' 
                      ? { bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40', dot: 'bg-emerald-500', label: locale === 'ta' ? 'செயல்படும்' : 'Active' }
                      : kilai.status === 'INACTIVE'
                      ? { bg: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/60 dark:border-red-900/40', dot: 'bg-red-500', label: locale === 'ta' ? 'செயல்படாத' : 'Inactive' }
                      : { bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40', dot: 'bg-amber-500', label: locale === 'ta' ? 'நிலுவையில்' : 'Pending' };

                  return (
                    <div 
                      key={kilai.id} 
                      className="group relative flex flex-col h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-sm hover:shadow-xl hover:shadow-[#8F0A1B]/6 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all duration-300 overflow-hidden hover:-translate-y-1"
                    >
                      {/* Ambient Accent Glow & Top Line */}
                      <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 opacity-30 transition-all duration-500 pointer-events-none" />
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] via-[#D97706] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Desktop Action Buttons Overlay (Top-Right on Hover) */}
                      <div className="hidden md:flex absolute top-3.5 right-3.5 items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0 z-10">
                        <Button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEdit(kilai); }} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-500 hover:text-[#8F0A1B] hover:bg-[#8F0A1B]/10 rounded-full transition-colors bg-white/80 dark:bg-zinc-800/80 shadow-xs border border-zinc-200/50 dark:border-zinc-700/50"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(kilai.id); }} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-full transition-colors bg-white/80 dark:bg-zinc-800/80 shadow-xs border border-zinc-200/50 dark:border-zinc-700/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Link href={`/kilais/${kilai.id}`} className="flex-1 flex flex-col cursor-pointer p-5 pb-4 md:pb-5">
                        {/* Header Section */}
                        <div className="flex items-center gap-3 mb-3.5 pr-0 md:pr-16">
                          <div className="w-11 h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center border bg-red-50 text-[#8F0A1B] border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40 transition-transform group-hover:scale-105 duration-300 mt-0.5">
                            <Building2 className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-[16px] sm:text-[17px] text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors line-clamp-2 md:line-clamp-1 mb-1 break-words">
                              {kilai.name}
                            </h3>
                          </div>
                        </div>

                        {/* Leader / Secretary Executive Badge */}
                        <div className="flex-1 flex flex-col justify-center my-2">
                          {(secretaryName || secretaryPhone) ? (
                            <div className="flex items-center justify-between gap-3.5 bg-gradient-to-br from-zinc-50/90 to-white dark:from-zinc-900/90 dark:to-zinc-950/80 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 group-hover:border-[#8F0A1B]/25 dark:group-hover:border-[#8F0A1B]/40 transition-colors shadow-xs">
                              <div className="flex flex-col flex-1 min-w-0 pr-1">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-[#8F0A1B]/10 text-[#8F0A1B] dark:bg-[#8F0A1B]/25 dark:text-red-300">
                                    <ShieldCheck className="w-3 h-3 text-[#8F0A1B] dark:text-red-400" />
                                    {locale === 'ta' ? 'செயலாளர்' : 'Secretary'}
                                  </span>
                                </div>
                                <h4 className="text-[14px] sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 truncate leading-snug mb-1.5 group-hover:text-[#8F0A1B] transition-colors">
                                  {secretaryName || (locale === 'ta' ? 'கிளை செயலாளர்' : 'Kilai Secretary')}
                                </h4>
                                {secretaryPhone ? (
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setCallConfirmation({ name: secretaryName ?? '', phone: secretaryPhone });
                                    }} 
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-xs w-max group/phone"
                                  >
                                    <PhoneCall className="w-3 h-3 group-hover/phone:animate-bounce" />
                                    <span>{secretaryPhone}</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-zinc-400 italic">{locale === 'ta' ? 'தொலைபேசி எண் இல்லை' : 'No phone provided'}</span>
                                )}
                              </div>
                              <div className="relative group-hover:scale-105 transition-transform duration-300 shrink-0">
                                <UserAvatar 
                                  src={secretaryPhoto} 
                                  name={secretaryName || (locale === 'ta' ? 'செயலாளர்' : 'Secretary')} 
                                  size="xl" 
                                  shape="square" 
                                  ring="primary" 
                                  elevation="md" 
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{locale === 'ta' ? 'தலைமை' : 'Leadership'}</span>
                                <span className="text-xs font-semibold text-zinc-500 italic mt-0.5">{locale === 'ta' ? 'நியமிக்கப்படவில்லை' : 'Not assigned'}</span>
                              </div>
                              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <Users className="w-6 h-6" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Panchayat & Union Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 my-2 justify-between">
                          {kilai.panchayat && (
                            <div 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
                              style={{ backgroundColor: '#6d9188ff', color: 'white' }}
                            >
                              <MapPin className="w-3 h-3 text-white" />
                              <span className="truncate max-w-[120px] text-white">{kilai.panchayat}</span>
                            </div>
                          )}
                          {kilaiUnion?.name && (
                            <div 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
                              style={{ backgroundColor: '#6d9188ff', color: 'white' }}
                            >
                              <Store className="w-3 h-3 text-white" />
                              <span className="truncate max-w-[120px] text-white">{getOrgUnitName(kilaiUnion, locale)}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Stats Footer */}
                        <div 
                          className="mt-2 flex items-center justify-between text-xs text-zinc-800 p-2"
                          style={{
                            background: '#e9edec',
                            borderRadius: '15px',
                            padding: '5px',
                            fontWeight: 'bold',
                          }}
                        >
                          <div className="flex items-center gap-1.5 px-2 font-bold">
                            <Layers className="w-3.5 h-3.5 text-[#8F0A1B]" />
                            <span><strong className="text-zinc-900 font-bold">{kilai.booths?.length || kilai.linkedBooths?.length || 0}</strong> {locale === 'ta' ? 'சாவடிகள்' : 'Booths'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 font-bold">
                            <Users className="w-3.5 h-3.5 text-[#8F0A1B]" />
                            <span><strong className="text-zinc-900 font-bold">{kilai._count?.cadres || 0}</strong> {locale === 'ta' ? 'நிர்வாகிகள்' : 'Cadres'}</span>
                          </div>
                        </div>
                      </Link>

                      {/* Mobile Actions Footer */}
                      <div className="flex md:hidden items-center justify-between gap-2 px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 mt-auto">
                        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          {tCommon('actions')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEdit(kilai); }} 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#8F0A1B] hover:border-[#8F0A1B]/40 hover:bg-[#8F0A1B]/5 rounded-lg transition-colors border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 shadow-2xs gap-1.5"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-[#8F0A1B]" />
                            <span>{tCommon('edit')}</span>
                          </Button>
                          <Button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(kilai.id); }} 
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
        )}
      </div>

      <CallConfirmationDialog 
        person={callConfirmation} 
        onOpenChange={(open) => !open && setCallConfirmation(null)} 
      />
    </div>
  );
}
