'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Eye, Edit2, Building2, Users, CheckCircle2, ChevronDown, Check, X, Trash2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useBooths, useCreateBooth, useUpdateBooth, useDeleteBooth } from '@/hooks/use-booths';
import { useKilais } from '@/hooks/use-kilais';
import { useCadres } from '@/hooks/use-cadres';

// Custom MultiSelect Dropdown
function MultiSelectDropdown({ 
  options, 
  selected, 
  onChange, 
  placeholder, 
  labelKey = 'name', 
  valueKey = 'id' 
}: { 
  options: any[], 
  selected: string[], 
  onChange: (val: string[]) => void, 
  placeholder: string,
  labelKey?: string,
  valueKey?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(item => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const removeOption = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== val));
  };

  const selectedItems = options.filter(opt => selected.includes(opt[valueKey]));

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="min-h-10 flex w-full flex-wrap items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-1.5 pr-2 pl-2.5 text-sm transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-primary/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedItems.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedItems.map(item => (
              <span key={item[valueKey]} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                {item[labelKey]}
                <button type="button" onClick={(e) => removeOption(e, item[valueKey])} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          {options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">No options available</div>
          ) : (
            options.map(option => {
              const isSelected = selected.includes(option[valueKey]);
              return (
                <div 
                  key={option[valueKey]}
                  className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  onClick={() => toggleOption(option[valueKey])}
                >
                  <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'}`}>
                    <Check className="h-3 w-3" />
                  </div>
                  {option[labelKey]}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function BoothsPage() {
  const { data: booths, isLoading } = useBooths();
  const { data: kilais } = useKilais();
  const { data: cadres } = useCadres();

  const createBooth = useCreateBooth();
  const updateBooth = useUpdateBooth();
  const deleteBooth = useDeleteBooth();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooth, setEditingBooth] = useState<any>(null);

  const initialFormState = {
    name: '',
    boothNo: '',
    maleCount: 0,
    femaleCount: 0,
    thirdGenderCount: 0,
    totalCount: 0,
    kilaiIds: [] as string[],
    agentIds: [] as string[],
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleOpenDialog = (booth?: any) => {
    if (booth) {
      setEditingBooth(booth);
      setFormData({
        name: booth.name || '',
        boothNo: booth.boothNo || '',
        maleCount: booth.maleCount || 0,
        femaleCount: booth.femaleCount || 0,
        thirdGenderCount: booth.thirdGenderCount || 0,
        totalCount: booth.totalCount || 0,
        kilaiIds: booth.kilais?.map((k: any) => k.id) || [],
        agentIds: booth.agents?.map((a: any) => a.id) || [],
      });
    } else {
      setEditingBooth(null);
      setFormData(initialFormState);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        maleCount: Number(formData.maleCount),
        femaleCount: Number(formData.femaleCount),
        thirdGenderCount: Number(formData.thirdGenderCount),
        totalCount: Number(formData.totalCount),
      };

      if (editingBooth) {
        await updateBooth.mutateAsync({ id: editingBooth.id, data: payload });
      } else {
        await createBooth.mutateAsync(payload);
      }
      setIsDialogOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to save booth', error);
      alert('Error saving booth');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booth?')) {
      try {
        await deleteBooth.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete', error);
        alert('Error deleting booth');
      }
    }
  };

  const filteredBooths = booths?.filter((b: any) => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.boothNo.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase tracking-wide text-primary">Booths</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Manage voting booths, agents, and voter demographics.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> Add Booth
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBooth ? 'Edit Booth' : 'Add New Booth'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="boothNo">Booth Number *</Label>
                  <Input 
                    id="boothNo" 
                    value={formData.boothNo} 
                    onChange={e => setFormData({...formData, boothNo: e.target.value})}
                    required 
                    placeholder="e.g. B-101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Booth Name *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required 
                    placeholder="e.g. Govt School"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Linked Kilais</Label>
                <MultiSelectDropdown 
                  options={kilais || []}
                  selected={formData.kilaiIds}
                  onChange={(val) => setFormData({...formData, kilaiIds: val})}
                  placeholder="Select kilais..."
                />
              </div>

              <div className="space-y-2">
                <Label>Booth Agents (Cadres)</Label>
                <MultiSelectDropdown 
                  options={cadres || []}
                  selected={formData.agentIds}
                  onChange={(val) => setFormData({...formData, agentIds: val})}
                  placeholder="Select agents..."
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maleCount">Male</Label>
                  <Input 
                    id="maleCount" 
                    type="number" 
                    min="0"
                    value={formData.maleCount} 
                    onChange={e => setFormData({...formData, maleCount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="femaleCount">Female</Label>
                  <Input 
                    id="femaleCount" 
                    type="number" 
                    min="0"
                    value={formData.femaleCount} 
                    onChange={e => setFormData({...formData, femaleCount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thirdGenderCount">3rd Gender</Label>
                  <Input 
                    id="thirdGenderCount" 
                    type="number" 
                    min="0"
                    value={formData.thirdGenderCount} 
                    onChange={e => setFormData({...formData, thirdGenderCount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalCount">Total</Label>
                  <Input 
                    id="totalCount" 
                    type="number" 
                    min="0"
                    value={formData.totalCount} 
                    onChange={e => setFormData({...formData, totalCount: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white" disabled={createBooth.isPending || updateBooth.isPending}>
                  {editingBooth ? 'Update Booth' : 'Save Booth'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Booths</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">{booths?.length || 0}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-manjal/20 rounded-md text-amber-600 dark:text-manjal">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Voters</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">
                {booths?.reduce((acc: number, curr: any) => acc + (curr.totalCount || 0), 0) || 0}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Agent Coverage</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">
                {booths?.length ? Math.round((booths.filter((b: any) => b.agents?.length > 0).length / booths.length) * 100) : 0}%
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search booths by name or number..." 
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="h-11 rounded-md px-6 font-medium border-primary/20 text-primary hover:bg-primary/5">Export CSV</Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden p-2">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-primary py-4">Booth</TableHead>
              <TableHead className="font-semibold text-primary py-4">Linked Kilais</TableHead>
              <TableHead className="font-semibold text-primary py-4">Agents (Cadres)</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-center">M / F / 3rd</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-center">Total Count</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading booths...</TableCell>
              </TableRow>
            ) : filteredBooths.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No booths found.</TableCell>
              </TableRow>
            ) : (
              filteredBooths.map((booth: any) => (
                <TableRow key={booth.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-base text-foreground">{booth.boothNo}</span>
                      <span className="text-sm text-muted-foreground">{booth.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium py-4">
                    <div className="flex flex-wrap gap-1">
                      {booth.kilais?.map((kilai: any, i: number) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          {kilai.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-wrap gap-1">
                      {booth.agents?.map((agent: any, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                          {agent.name}
                        </span>
                      ))}
                      {!booth.agents?.length && <span className="text-xs text-muted-foreground italic">None assigned</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4 font-medium text-muted-foreground">
                    <span className="text-blue-600">{booth.maleCount}</span> / <span className="text-pink-600">{booth.femaleCount}</span> / <span className="text-purple-600">{booth.thirdGenderCount}</span>
                  </TableCell>
                  <TableCell className="text-center font-bold text-foreground py-4">
                    {booth.totalCount}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full" onClick={() => handleOpenDialog(booth)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => handleDelete(booth.id)}>
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
