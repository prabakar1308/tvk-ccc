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
import { Search, Plus, UserCheck, UserPlus, Trophy, Edit2, Trash2, UploadCloud, AlertCircle, LayoutGrid, List, ChevronRight, ChevronLeft, Phone } from "lucide-react";
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useCadres, useDeleteCadre } from '@/hooks/use-cadres';
import { useUnions } from '@/hooks/use-unions';
import { useKilais } from '@/hooks/use-kilais';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateCadreDto } from '@/services/api/cadres';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { CadreViewDialog } from '@/components/cadre-view-dialog';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';

export default function CadresPage() {
  const t = useTranslations('Cadres');
  const tCommon = useTranslations('Common');
  const tForms = useTranslations('Forms');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterUnionId, setFilterUnionId] = useState<string>('');
  const [filterKilaiId, setFilterKilaiId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<'TABLE' | 'TILE'>('TILE');
  const [includeKilai, setIncludeKilai] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const level = params.get('level');
      const filterLevelParam = params.get('filterLevel');
      const unionId = params.get('unionId');
      
      if (level) {
        setLevelFilter(level);
        setFilterLevel(level);
      } else if (filterLevelParam) {
        setLevelFilter('ALL');
        setFilterLevel(filterLevelParam);
      }
      
      if (unionId) {
        setFilterUnionId(unionId);
      }
      
      const includeKilaiParam = params.get('includeKilai');
      if (includeKilaiParam === 'true') {
        setIncludeKilai(true);
      }
    }
  }, []);
  
  const LEVELS = ['ALL', 'DISTRICT', 'UNION', 'KILAI'];

  const switchTab = (direction: 'left' | 'right') => {
    const currentIndex = LEVELS.indexOf(levelFilter);
    let newIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= LEVELS.length) newIndex = 0;
    if (newIndex < 0) newIndex = LEVELS.length - 1;
    
    const newLevel = LEVELS[newIndex];
    setLevelFilter(newLevel);
    setFilterLevel('ALL');
    setFilterUnionId('');
    setFilterKilaiId('');
  };
  
  const { data: cadres, isLoading } = useCadres();
  const { data: unions = [] } = useUnions();
  const { data: kilais = [] } = useKilais();
  const deleteMutation = useDeleteCadre();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  
  const [viewingCadre, setViewingCadre] = useState<any | null>(null);
  const [callConfirmation, setCallConfirmation] = useState<{name: string, phone: string} | null>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, cadre: any) => {
    e.stopPropagation();
    setEditingId(cadre.id);
    setIsModalOpen(true);
  };

  const handleOpenView = (cadre: any) => {
    setViewingCadre(cadre);
  };

  const scrollToTable = () => {
    document.getElementById('cadres-table-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmation(id);
  };

  const filteredCadres = cadres?.filter((cadre) => {
    const matchesSearch = cadre.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cadre.memberId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cadre.phone?.includes(searchQuery) ||
                          cadre.aadhaarNumber?.includes(searchQuery);
    
    const currentTabLevel = levelFilter === 'ALL' ? filterLevel : levelFilter;
    let matchesLevel = currentTabLevel === 'ALL' || cadre.level === currentTabLevel;
    
    if (includeKilai && filterUnionId && currentTabLevel === 'UNION') {
      matchesLevel = cadre.level === 'UNION' || cadre.level === 'KILAI';
    }
    
    const matchesUnion = filterUnionId ? cadre.unionId === filterUnionId : true;
    const matchesKilai = filterKilaiId ? cadre.homeKilaiId === filterKilaiId : true;
    
    return matchesSearch && matchesLevel && matchesUnion && matchesKilai;
  }) || [];

  const getRoleBadge = (role: string | undefined, level: string, isShort = false) => {
    let displayRole = role || 'Administrator';
    if (isShort && displayRole === 'Executive Committee Member') {
      displayRole = 'EC Member';
    }
    
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
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold uppercase tracking-wide text-primary">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">{t('description')}</p>
        </div>
        
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
            <Plus className="mr-2 h-5 w-5" /> {t('register')}
          </Button>
      <CadreFormDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingId={editingId}
        cadres={cadres}
      />
      
      <CadreViewDialog
        isOpen={!!viewingCadre}
        onOpenChange={(open) => !open && setViewingCadre(null)}
        cadre={viewingCadre}
      />

      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card 
          onClick={scrollToTable}
          className="border-2 border-primary/20 dark:border-primary/30 shadow-md bg-white dark:bg-zinc-900 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 cursor-pointer"
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('totalCadres')}</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">{cadres?.length || 0}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-primary/20 dark:border-primary/30 shadow-md bg-white dark:bg-zinc-900 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-manjal/20 rounded-md text-amber-600 dark:text-manjal">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('newThisMonth')}</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">+{(cadres?.length || 0) > 0 ? 1 : 0}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 dark:border-primary/30 shadow-md bg-white dark:bg-zinc-900 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('activeCadres')}</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">100%</h2>
            </div>
          </CardContent>
        </Card>
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/cadres/import">
            <Button variant="outline" className="h-11 rounded-md px-6 font-medium border-primary/20 text-primary hover:bg-primary/5 m-0">
              <UploadCloud className="w-4 h-4 mr-2" /> {tCommon('importExcel')}
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => setViewType(viewType === 'TABLE' ? 'TILE' : 'TABLE')}
            className="h-11 rounded-md px-4 font-medium border-primary/20 text-primary hover:bg-primary/5 shrink-0 m-0"
          >
            {viewType === 'TABLE' ? <LayoutGrid className="w-5 h-5 sm:mr-2" /> : <List className="w-5 h-5 sm:mr-2" />}
            <span className="hidden sm:inline">{viewType === 'TABLE' ? 'Tile View' : 'Table View'}</span>
          </Button>
        </div>
      </div>

      {/* Data Table with Tabs */}
      <div id="cadres-table-section" className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden p-2 scroll-mt-20">
        
        {/* Desktop Tabs */}
        <div className="hidden md:flex border-b border-primary/10 mb-4 px-2 space-x-4">
          {LEVELS.map((level) => (
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
              {level === 'ALL' ? t('allCadres') : `${level.charAt(0) + level.slice(1).toLowerCase()} ${t('levelSuffix')}`}
            </button>
          ))}
        </div>
        
        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden items-center justify-between border-b border-primary/10 mb-4 px-2 py-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
            onClick={() => switchTab('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="font-semibold text-primary text-center px-4">
            {levelFilter === 'ALL' ? t('allCadres') : `${levelFilter.charAt(0) + levelFilter.slice(1).toLowerCase()} ${t('levelSuffix')}`}
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
            onClick={() => switchTab('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Dynamic Filters */}
        <div className="px-4 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
             {levelFilter === 'ALL' && (
               <div className="w-48">
                 <Select value={filterLevel} onValueChange={(v) => { setFilterLevel(v || 'ALL'); setFilterUnionId(''); setFilterKilaiId(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('allLevels')}>
                        {filterLevel === 'DISTRICT' ? t('districtLevel') : filterLevel === 'UNION' ? t('unionLevel') : filterLevel === 'KILAI' ? t('kilaiLevel') : t('allLevels')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="ALL">{t('allLevels')}</SelectItem>
                       <SelectItem value="DISTRICT">{t('districtLevel')}</SelectItem>
                       <SelectItem value="UNION">{t('unionLevel')}</SelectItem>
                       <SelectItem value="KILAI">{t('kilaiLevel')}</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
             )}

             {(levelFilter === 'UNION' || levelFilter === 'KILAI' || (levelFilter === 'ALL' && (filterLevel === 'UNION' || filterLevel === 'KILAI'))) && (
               <div className="w-56">
                 <Select value={filterUnionId} onValueChange={(v) => { setFilterUnionId(v || ''); setFilterKilaiId(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectUnion')}>
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

             {((levelFilter === 'UNION' || (levelFilter === 'ALL' && filterLevel === 'UNION')) && filterUnionId) && (
               <div className="flex items-center space-x-2 bg-primary/5 px-3 h-9 rounded-md border border-primary/10">
                 <Checkbox 
                   id="includeKilai" 
                   checked={includeKilai}
                   onCheckedChange={(c) => setIncludeKilai(!!c)}
                 />
                 <label 
                   htmlFor="includeKilai"
                   className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-primary cursor-pointer whitespace-nowrap"
                 >
                   Include Kilai
                 </label>
               </div>
             )}

             {(levelFilter === 'KILAI' || (levelFilter === 'ALL' && filterLevel === 'KILAI')) && (
               <div className="w-56">
                 <Select value={filterKilaiId} onValueChange={(v) => setFilterKilaiId(v || '')} disabled={!filterUnionId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectKilai')}>
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
          
          {/* Total Count */}
          <div className="bg-primary/5 text-primary border border-primary/10 px-4 py-2 rounded-md font-semibold text-sm whitespace-nowrap">
            {t('totalAdministrators')}: {filteredCadres.length}
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
          ) : filteredCadres.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('noCadres')}</div>
          ) : viewType === 'TABLE' ? (
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-primary py-4">{t('memberId')}</TableHead>
                    <TableHead className="font-semibold text-primary py-4">{tForms('name')}</TableHead>
                    <TableHead className="font-semibold text-primary py-4">{t('level')}</TableHead>
                    <TableHead className="font-semibold text-primary py-4">{t('designation')}</TableHead>
                    <TableHead className="font-semibold text-primary py-4">{tForms('phone')}</TableHead>
                    <TableHead className="font-semibold text-primary py-4 text-right">{tCommon('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCadres.map((cadre) => (
                    <TableRow 
                      key={cadre.id} 
                      className="hover:bg-primary/5 transition-colors group border-b-primary/10 cursor-pointer"
                      onClick={() => handleOpenView(cadre)}
                    >
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
                      <TableCell className="font-medium py-4 text-muted-foreground">
                        {cadre.phone ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setCallConfirmation({ name: cadre.name, phone: cadre.phone || '' }); }}
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md"
                          >
                            <Phone className="w-3 h-3" />
                            {cadre.phone}
                          </button>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex justify-end gap-2 transition-opacity">
                          <Button onClick={(e) => handleOpenEdit(e, cadre)} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button onClick={(e) => handleDelete(e, cadre.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                {filteredCadres.map((cadre) => (
                  <div 
                    key={cadre.id} 
                    onClick={() => handleOpenView(cadre)}
                    className="flex flex-col items-center justify-center pt-5 px-3 pb-2 sm:p-5 rounded-xl border hover:shadow-md transition-all duration-300 group cursor-pointer h-full bg-[#F8F9FA] border-gray-100 hover:border-primary/20 relative"
                  >
                    {/* Desktop Actions (Top Right Hover) */}
                    <div className="hidden md:flex absolute top-2 right-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button onClick={(e) => handleOpenEdit(e, cadre)} variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button onClick={(e) => handleDelete(e, cadre.id)} variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 border-2 shadow-sm border-white group-hover:border-primary transition-colors">
                      <img src={cadre.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cadre.name)}&background=random`} alt={cadre.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-bold text-[14px] sm:text-[15px] text-gray-900 text-center leading-tight mb-1">{cadre.name}</h3>
                    <p className="text-[11px] text-muted-foreground mb-1 font-mono">{cadre.memberId}</p>
                    {cadre.phone && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCallConfirmation({ name: cadre.name, phone: cadre.phone || '' }); }}
                        className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md mb-1.5"
                      >
                        <Phone className="w-3 h-3" />
                        {cadre.phone}
                      </button>
                    )}
                    <div className="mt-1">
                      {getRoleBadge(cadre.role, cadre.level, true)}
                    </div>
                    
                    {/* Mobile Actions (Bottom Inline) */}
                    <div className="flex md:hidden w-full justify-center gap-6 mt-4 pt-2 border-t border-gray-200/60">
                      <Button onClick={(e) => handleOpenEdit(e, cadre)} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button onClick={(e) => handleDelete(e, cadre.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
      
      <CallConfirmationDialog 
        person={callConfirmation} 
        onOpenChange={(open) => !open && setCallConfirmation(null)} 
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{tCommon('delete')}</DialogTitle>
            <DialogDescription className="pt-2">
              {t('deleteConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>{tCommon('cancel')}</Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (deleteConfirmation) {
                  deleteMutation.mutate(deleteConfirmation, {
                    onSuccess: () => {
                      setDeleteConfirmation(null);
                    }
                  });
                }
              }}
            >
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
