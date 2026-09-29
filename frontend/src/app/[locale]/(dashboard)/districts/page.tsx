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
import { Search, Plus, MapPin, Eye, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDistricts, useCreateDistrict, useUpdateDistrict, useDeleteDistrict } from '@/hooks/use-districts';
import { useTranslations } from 'next-intl';

export default function DistrictsPage() {
  const t = useTranslations('Districts');
  const tCommon = useTranslations('Common');
  const { data: districts, isLoading } = useDistricts();
  const createMutation = useCreateDistrict();
  const updateMutation = useUpdateDistrict();
  const deleteMutation = useDeleteDistrict();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', contactName: '', contactPhone: '', contactEmail: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (district: any) => {
    setEditingId(district.id);
    setFormData({
      name: district.name || '',
      contactName: district.contactName || '',
      contactPhone: district.contactPhone || '',
      contactEmail: district.contactEmail || ''
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
              <DialogTitle>{editingId ? t('editDistrict') : t('addNew')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('districtName')} *</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">{t('contactName')}</Label>
                <Input 
                  id="contactName" 
                  value={formData.contactName}
                  onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">{t('contactPhone')}</Label>
                <Input 
                  id="contactPhone" 
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">{t('contactEmail')}</Label>
                <Input 
                  id="contactEmail" 
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{tCommon('cancel')}</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? tCommon('saveChanges') : t('createDistrict')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder={t('searchPlaceholder')} 
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-primary py-4">{t('districtName')}</TableHead>
              <TableHead className="font-semibold text-primary py-4">{t('contactName')}</TableHead>
              <TableHead className="font-semibold text-primary py-4">{t('phone')}</TableHead>
              <TableHead className="font-semibold text-primary py-4">{t('createdAt')}</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-right">{tCommon('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('loading')}</TableCell>
              </TableRow>
            ) : districts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('noDistricts')}</TableCell>
              </TableRow>
            ) : (
              districts?.map((district) => (
                <TableRow key={district.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                  <TableCell className="font-bold text-base py-4 text-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {district.name}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 font-medium">{district.contactName || '-'}</TableCell>
                  <TableCell className="py-4 font-medium text-muted-foreground">{district.contactPhone || '-'}</TableCell>
                  <TableCell className="text-muted-foreground py-4 font-medium">{new Date(district.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end gap-2 transition-opacity">
                      <Button onClick={() => handleOpenEdit(district)} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(district.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
