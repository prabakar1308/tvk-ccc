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
import { Search, Plus, MapPin, Eye, Edit2, Trash2, Building2, Building, Store } from "lucide-react";
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
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

export default function UnionsPage() {
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
  
  const [formData, setFormData] = useState({
    name: '',
    group: 'KURINJIPADI',
    unitType: 'UNION',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', group: 'KURINJIPADI', unitType: 'UNION', contactName: '', contactPhone: '', contactEmail: '' });
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
      contactEmail: union.contactEmail || ''
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? t('editUnion') : t('addNew')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{tCommon('cancel')}</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? tCommon('saveChanges') : t('createUnion')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder={t('searchPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select value={unitTypeFilter} onValueChange={(val) => setUnitTypeFilter(val || '')}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20">
              <SelectValue placeholder="All Unit Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Unit Types</SelectItem>
              <SelectItem value="UNION">Union</SelectItem>
              <SelectItem value="TOWN">Town</SelectItem>
              <SelectItem value="TOWN_PANCHAYAT">Town Panchayat</SelectItem>
              <SelectItem value="AREA">Area</SelectItem>
            </SelectContent>
          </Select>
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
              <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-primary py-4">{t('unionName')}</TableHead>
                      <TableHead className="font-semibold text-primary py-4">{tForms('contactName')}</TableHead>
                      <TableHead className="font-semibold text-primary py-4">{tForms('phone')}</TableHead>
                      <TableHead className="font-semibold text-primary py-4 text-right">{tCommon('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupUnions.map((union: any) => (
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
                              <span>{union.name}</span>
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                                {union.unitType === 'TOWN_PANCHAYAT' ? 'Town Panchayat' : union.unitType || 'Union'}
                              </span>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="py-4 font-medium">{union.contactName || '-'}</TableCell>
                        <TableCell className="py-4 font-medium text-muted-foreground">{union.contactPhone || '-'}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
