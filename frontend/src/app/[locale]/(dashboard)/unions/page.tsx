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
import { Search, Plus, MapPin, Eye, Edit2, Trash2, Building2 } from "lucide-react";
import { Link } from '@/i18n/routing';
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
  const { data: unions, isLoading } = useUnions();
  const { data: districts } = useDistricts();
  const createMutation = useCreateUnion();
  const updateMutation = useUpdateUnion();
  const deleteMutation = useDeleteUnion();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    districtId: '',
    group: 'KURINJIPADI',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', districtId: '', group: 'KURINJIPADI', contactName: '', contactPhone: '', contactEmail: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (union: any) => {
    setEditingId(union.id);
    setFormData({
      name: union.name || '',
      districtId: union.districtId ? String(union.districtId) : '',
      group: union.group || 'KURINJIPADI',
      contactName: union.contactName || '',
      contactPhone: union.contactPhone || '',
      contactEmail: union.contactEmail || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.districtId) {
      alert("Please select a district");
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
    if (confirm("Are you sure you want to delete this union?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase tracking-wide text-primary">Unions</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Manage all organizational unions.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger 
            render={
              <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95" />
            }
          >
            <Plus className="mr-2 h-5 w-5" /> Add New Union
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Union' : 'Add New Union'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Union Name *</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="districtId">District *</Label>
                <Select 
                  value={formData.districtId} 
                  onValueChange={(val) => setFormData({...formData, districtId: val})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a district">
                      {formData.districtId 
                        ? districts?.find((d: any) => String(d.id || d._id) === formData.districtId)?.name || formData.districtId
                        : "Select a district"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {districts?.map((d: any) => (
                      <SelectItem key={d.id || d._id} value={String(d.id || d._id)} label={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="group">Group *</Label>
                <Select 
                  value={formData.group} 
                  onValueChange={(val) => setFormData({...formData, group: val})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a group">
                      {formData.group === 'KURINJIPADI' ? 'Kurinjipadi' : formData.group === 'CUDDALORE' ? 'Cuddalore' : formData.group || 'Select a group'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KURINJIPADI">Kurinjipadi</SelectItem>
                    <SelectItem value="CUDDALORE">Cuddalore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input 
                  id="contactName" 
                  value={formData.contactName}
                  onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input 
                  id="contactPhone" 
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? 'Save Changes' : 'Create Union'}
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
            placeholder="Search unions by name..." 
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>
      </div>

      {/* Data Tables Grouped */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-primary/20 shadow-sm">Loading unions...</div>
        ) : !unions || unions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-primary/20 shadow-sm">No unions found.</div>
        ) : (
          Object.entries(
            unions.reduce((acc, union) => {
              const group = union.group || 'OTHER';
              if (!acc[group]) acc[group] = [];
              acc[group].push(union);
              return acc;
            }, {} as Record<string, typeof unions>)
          )
          .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
          .map(([groupKey, groupUnions]) => (
            <div key={groupKey} className="space-y-4">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <div className="w-2 h-6 bg-[#8F0A1B] rounded-sm"></div>
                {groupKey === 'KURINJIPADI' ? 'Kurinjipadi' : groupKey === 'CUDDALORE' ? 'Cuddalore' : groupKey}
              </h2>
              <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-primary py-4">Union Name</TableHead>
                      <TableHead className="font-semibold text-primary py-4">District</TableHead>
                      <TableHead className="font-semibold text-primary py-4">Contact Name</TableHead>
                      <TableHead className="font-semibold text-primary py-4">Phone</TableHead>
                      <TableHead className="font-semibold text-primary py-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupUnions.map((union) => (
                      <TableRow key={union.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                        <TableCell className="font-bold text-base py-4 text-foreground">
                          <Link href={`/unions/${union.id}`} className="flex items-center gap-2 hover:text-[#8F0A1B] transition-colors cursor-pointer">
                            <Building2 className="h-4 w-4 text-[#8F0A1B]" />
                            {union.name}
                          </Link>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-manjal text-black shadow-sm">
                            {union.district?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 font-medium">{union.contactName || '-'}</TableCell>
                        <TableCell className="py-4 font-medium text-muted-foreground">{union.contactPhone || '-'}</TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
