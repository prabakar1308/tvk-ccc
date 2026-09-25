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
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, UserCheck, UserPlus, Trophy, Edit2, Trash2, UploadCloud, AlertCircle } from "lucide-react";
import { Link } from '@/i18n/routing';
import { useCadres, useDeleteCadre } from '@/hooks/use-cadres';
import { useUnions } from '@/hooks/use-unions';
import { useKilais } from '@/hooks/use-kilais';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateCadreDto } from '@/services/api/cadres';
import { CadreFormDialog } from '@/components/cadre-form-dialog';

export default function CadresPage() {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterUnionId, setFilterUnionId] = useState<string>('');
  const [filterKilaiId, setFilterKilaiId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: cadres, isLoading } = useCadres();
  const { data: unions = [] } = useUnions();
  const { data: kilais = [] } = useKilais();
  const deleteMutation = useDeleteCadre();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cadre: any) => {
    setEditingId(cadre.id);
    setIsModalOpen(true);
  };

  

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this cadre?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCadres = cadres?.filter((cadre) => {
    const matchesSearch = cadre.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cadre.memberId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cadre.phone?.includes(searchQuery);
    
    const currentTabLevel = levelFilter === 'ALL' ? filterLevel : levelFilter;
    const matchesLevel = currentTabLevel === 'ALL' || cadre.level === currentTabLevel;
    
    const matchesUnion = filterUnionId ? cadre.unionId === filterUnionId : true;
    const matchesKilai = filterKilaiId ? cadre.homeKilaiId === filterKilaiId : true;
    
    return matchesSearch && matchesLevel && matchesUnion && matchesKilai;
  }) || [];

  const getRoleBadge = (role: string | undefined, level: string) => {
    const displayRole = role || 'Cadre';
    if (level === 'DISTRICT') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#8F0A1B] text-white border border-[#8F0A1B]/20 shadow-sm">{displayRole}</span>;
    }
    if (level === 'UNION') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-manjal text-black border border-manjal/20 shadow-sm">{displayRole}</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">{displayRole}</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase tracking-wide text-primary">Cadres</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Manage party members, roles, and grassroots engagement.</p>
        </div>
        
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
            <Plus className="mr-2 h-5 w-5" /> Register Cadre
          </Button>
      <CadreFormDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingId={editingId}
        cadres={cadres}
      />

      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Cadres</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">{cadres?.length || 0}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-manjal/20 rounded-md text-amber-600 dark:text-manjal">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">New This Month</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">+{(cadres?.length || 0) > 0 ? 1 : 0}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Cadres</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">100%</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search cadres by name, ID, or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/cadres/import">
            <Button variant="outline" className="h-11 rounded-md px-6 font-medium border-primary/20 text-primary hover:bg-primary/5">
              <UploadCloud className="w-4 h-4 mr-2" /> Import Excel
            </Button>
          </Link>
          <Button variant="outline" className="h-11 rounded-md px-6 font-medium border-primary/20 text-primary hover:bg-primary/5">Export CSV</Button>
        </div>
      </div>

      {/* Data Table with Tabs */}
      <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden p-2">
        <div className="flex border-b border-primary/10 mb-4 px-2 space-x-4 overflow-x-auto">
          {['ALL', 'DISTRICT', 'UNION', 'KILAI'].map((level) => (
            <button 
              key={level}
              onClick={() => {
                setLevelFilter(level);
                setFilterLevel('ALL');
                setFilterUnionId('');
                setFilterKilaiId('');
              }}
              className={`px-4 py-2 font-semibold whitespace-nowrap ${levelFilter === level ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              {level === 'ALL' ? 'All Cadres' : `${level.charAt(0) + level.slice(1).toLowerCase()} Level`}
            </button>
          ))}
        </div>

        {/* Dynamic Filters */}
        <div className="px-4 mb-4 flex flex-wrap gap-4 items-center">
           {levelFilter === 'ALL' && (
             <div className="w-48">
               <Select value={filterLevel} onValueChange={(v) => { setFilterLevel(v || 'ALL'); setFilterUnionId(''); setFilterKilaiId(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels">
                      {filterLevel === 'DISTRICT' ? 'District Level' : filterLevel === 'UNION' ? 'Union Level' : filterLevel === 'KILAI' ? 'Kilai Level' : 'All Levels'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="ALL">All Levels</SelectItem>
                     <SelectItem value="DISTRICT">District Level</SelectItem>
                     <SelectItem value="UNION">Union Level</SelectItem>
                     <SelectItem value="KILAI">Kilai Level</SelectItem>
                  </SelectContent>
               </Select>
             </div>
           )}

           {(levelFilter === 'UNION' || levelFilter === 'KILAI' || (levelFilter === 'ALL' && (filterLevel === 'UNION' || filterLevel === 'KILAI'))) && (
             <div className="w-56">
               <Select value={filterUnionId} onValueChange={(v) => { setFilterUnionId(v || ''); setFilterKilaiId(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Union">
                      {filterUnionId ? unions.find((u: any) => String(u.id || u._id) === filterUnionId)?.name : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                     {unions.map((u: any) => (
                       <SelectItem key={String(u.id || u._id)} value={String(u.id || u._id)}>{u.name}</SelectItem>
                     ))}
                  </SelectContent>
               </Select>
             </div>
           )}

           {(levelFilter === 'KILAI' || (levelFilter === 'ALL' && filterLevel === 'KILAI')) && (
             <div className="w-56">
               <Select value={filterKilaiId} onValueChange={(v) => setFilterKilaiId(v || '')} disabled={!filterUnionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Kilai">
                      {filterKilaiId ? kilais.find((k: any) => String(k.id || k._id) === filterKilaiId)?.name : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                     {kilais.filter((k: any) => String(k.unionId) === filterUnionId).map((k: any) => (
                       <SelectItem key={String(k.id || k._id)} value={String(k.id || k._id)}>{k.name}</SelectItem>
                     ))}
                  </SelectContent>
               </Select>
             </div>
           )}
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading cadres...</div>
          ) : filteredCadres.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No cadres found.</div>
          ) : (
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-primary py-4">Member ID</TableHead>
                  <TableHead className="font-semibold text-primary py-4">Name</TableHead>
                  <TableHead className="font-semibold text-primary py-4">Level</TableHead>
                  <TableHead className="font-semibold text-primary py-4">Designation</TableHead>
                  <TableHead className="font-semibold text-primary py-4">Phone</TableHead>
                  <TableHead className="font-semibold text-primary py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCadres.map((cadre) => (
                  <TableRow key={cadre.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                    <TableCell className="font-bold text-muted-foreground py-4">{cadre.memberId}</TableCell>
                    <TableCell className="font-bold text-base py-4 text-foreground flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                        <img src={cadre.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cadre.name)}&background=random`} alt={cadre.name} className="w-full h-full object-cover" />
                      </div>
                      {cadre.name}
                    </TableCell>
                    <TableCell className="py-4 font-medium text-primary">{cadre.level}</TableCell>
                    <TableCell className="py-4">
                      {getRoleBadge(cadre.role, cadre.level)}
                    </TableCell>
                    <TableCell className="font-medium py-4 text-muted-foreground">{cadre.phone || '-'}</TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2 transition-opacity">
                        <Button onClick={() => handleOpenEdit(cadre)} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDelete(cadre.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
