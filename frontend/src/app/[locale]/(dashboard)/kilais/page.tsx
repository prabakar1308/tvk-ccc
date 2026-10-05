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
import { Search, Eye, Building2, Plus, Edit2, Trash2, Check, ChevronsUpDown, X, Download, Upload, PhoneCall, LayoutGrid, List } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
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

export default function KilaisPage() {
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
                    : unions?.find((u: any) => String(u.id || u._id) === selectedUnion)?.name || t('filterUnion')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">{t('allUnions')}</SelectItem>
                {unions?.map((union: any) => (
                  <SelectItem key={union.id || union._id} value={String(union.id || union._id)}>
                    {union.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex w-full sm:w-auto justify-center items-center bg-zinc-100 dark:bg-zinc-900 rounded-md p-1 border border-primary/10">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-sm transition-all flex items-center justify-center ${viewMode === 'table' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tile')}
              className={`p-2 rounded-sm transition-all flex items-center justify-center ${viewMode === 'tile' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title="Tile View"
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
                      <TableHead className="font-semibold text-primary py-4">Panchayat</TableHead>
                      <TableHead className="font-semibold text-primary py-4">Secretary Details</TableHead>
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
                                <span className="font-medium text-sm text-foreground">{kilai.secretaryName}</span>
                                {kilai.phone && (
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setCallConfirmation({ name: kilai.secretaryName ?? '', phone: kilai.phone ?? '' });
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
                              {kilaiUnion?.name || '-'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredKilais.map((kilai) => {
                  const kilaiUnion = unions?.find((u: any) => String(u.id || u._id) === kilai.unionId);
                  
                  return (
                    <div key={kilai.id} className="bg-card border-2 border-primary/20 dark:border-primary/30 rounded-xl p-5 shadow-md hover:shadow-xl hover:border-primary/50 transition-all flex flex-col gap-4 relative group">
                      <div className="flex justify-between items-start gap-2">
                        <Link href={`/kilais/${kilai.id}`} className="flex items-start gap-2 hover:text-[#8F0A1B] transition-colors cursor-pointer font-bold text-lg text-foreground pr-16">
                          <Building2 className="h-5 w-5 text-[#8F0A1B] shrink-0 mt-0.5" />
                          <div className="flex flex-col leading-tight">
                            <span>{kilai.name}</span>
                            {kilai.tamilName && <span className="text-sm font-normal text-muted-foreground mt-0.5">({kilai.tamilName})</span>}
                          </div>
                        </Link>
                        <div className="absolute top-5 right-5">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                            kilai.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            kilai.status === 'INACTIVE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {kilai.status ? t(kilai.status.toLowerCase()) : t('pending')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4 flex-1 mt-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Panchayat</span>
                          <span className="font-medium text-sm bg-primary/5 px-2.5 py-1.5 rounded-md w-fit border border-primary/10">{kilai.panchayat || '-'}</span>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('union')}</span>
                          <span className="inline-flex items-center w-fit px-2.5 py-1.5 rounded-md text-sm font-bold bg-secondary/30 text-secondary-foreground border border-secondary/20">
                            {kilaiUnion?.name || '-'}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secretary</span>
                          {kilai.secretaryName ? (
                            <div className="flex flex-col gap-1.5 bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-md border border-border/50">
                              <span className="font-semibold text-sm text-foreground">{kilai.secretaryName}</span>
                              {kilai.phone && (
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCallConfirmation({ name: kilai.secretaryName ?? '', phone: kilai.phone ?? '' });
                                  }}
                                  className="text-xs text-primary hover:text-primary/80 cursor-pointer hover:underline text-left flex items-center gap-1.5 transition-colors w-fit focus:outline-none"
                                >
                                  <PhoneCall className="h-3.5 w-3.5" />
                                  <span className="font-medium">{kilai.phone}</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">Not assigned</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-border/50 mt-2 transition-opacity">
                        <Button onClick={() => handleOpenEdit(kilai)} variant="outline" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                          <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button onClick={() => handleDelete(kilai.id)} variant="outline" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Delete
                        </Button>
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
