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
import { Search, Eye, Building2, Plus, Edit2, Trash2, Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Link } from '@/i18n/routing';
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

export default function KilaisPage() {
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

  const initialFormData: CreateKilaiDto = {
    name: '',
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
      alert("Please select a union");
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
    if (confirm("Are you sure you want to delete this kilai?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredKilais = useMemo(() => {
    if (!kilais) return [];
    
    return kilais.filter((kilai) => {
      const matchesSearch = kilai.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUnion = selectedUnion === 'all' || kilai.unionId === selectedUnion;
      
      return matchesSearch && matchesUnion;
    });
  }, [kilais, searchQuery, selectedUnion]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase tracking-wide text-primary">Kilais</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Manage all organizational kilais.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger 
            render={
              <Button 
                onClick={handleOpenCreate} 
                className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95" 
              />
            }
          >
            <Plus className="mr-2 h-5 w-5" /> Add New Kilai
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Kilai' : 'Add New Kilai'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kilai Name *</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unionId">Union *</Label>
                <Select 
                  value={formData.unionId} 
                  onValueChange={(val) => setFormData({...formData, unionId: val || ''})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a union">
                      {formData.unionId 
                        ? unions?.find((u: any) => String(u.id || u._id) === formData.unionId)?.name || 'Select a union'
                        : "Select a union"}
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
                <Label>Linked Booths</Label>
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
                          <span className="text-muted-foreground">Select booths...</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] sm:w-[375px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search booths..." />
                      <CommandList>
                        <CommandEmpty>No booth found.</CommandEmpty>
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
                <Label>Villages / Areas</Label>
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
                          <span className="text-muted-foreground">Select areas...</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] sm:w-[375px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search areas..." />
                      <CommandList>
                        <CommandEmpty>No area found.</CommandEmpty>
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
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val: any) => setFormData({...formData, status: val})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? 'Save Changes' : 'Create Kilai'}
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
            placeholder="Search kilais by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>

        <div className="w-full sm:w-64">
          <Select value={selectedUnion} onValueChange={(value) => setSelectedUnion(value || '')}>
            <SelectTrigger className="h-11 border-primary/20 bg-zinc-50 dark:bg-zinc-900 focus:ring-primary/30 rounded-md w-full">
              <SelectValue placeholder="Filter by Union">
                {selectedUnion === 'all' 
                  ? 'All Unions' 
                  : unions?.find((u: any) => String(u.id || u._id) === selectedUnion)?.name || 'Filter by Union'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Unions</SelectItem>
              {unions?.map((union: any) => (
                <SelectItem key={union.id || union._id} value={String(union.id || union._id)}>
                  {union.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-primary/20 shadow-sm">Loading kilais...</div>
        ) : !filteredKilais || filteredKilais.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-primary/20 shadow-sm">No kilais found.</div>
        ) : (
          <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-primary py-4">Kilai Name</TableHead>
                  <TableHead className="font-semibold text-primary py-4">Union</TableHead>
                  <TableHead className="font-semibold text-primary py-4">Status</TableHead>
                  <TableHead className="font-semibold text-primary py-4 text-right">Actions</TableHead>
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
                          {kilai.status || 'PENDING'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button onClick={() => handleOpenEdit(kilai)} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleDelete(kilai.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button render={<Link href={`/kilais/${kilai.id}`} />} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
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
        )}
      </div>
    </div>
  );
}
