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
import { Search, Plus, Eye, Edit2, Building2, Users, CheckCircle2, ChevronDown, Check, X, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useBooths, useCreateBooth, useUpdateBooth, useDeleteBooth } from '@/hooks/use-booths';
import { useKilais } from '@/hooks/use-kilais';
import { useCadres } from '@/hooks/use-cadres';
import { shortenBoothName } from '@/lib/booth-utils';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Booths');
  const tCommon = useTranslations('Common');
  const { data: booths, isLoading } = useBooths();
  const { data: kilais } = useKilais();
  const { data: cadres } = useCadres();

  const createBooth = useCreateBooth();
  const updateBooth = useUpdateBooth();
  const deleteBooth = useDeleteBooth();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooth, setEditingBooth] = useState<any>(null);
  const [viewingBooth, setViewingBooth] = useState<any>(null);

  const initialFormState = {
    name: '',
    boothNo: '',
    area: '',
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
        area: booth.area || '',
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
      alert(t('errorSaving'));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        await deleteBooth.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete', error);
        alert(t('errorDeleting'));
      }
    }
  };

  const filteredBooths = booths?.filter((b: any) => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.boothNo.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredBooths.length / itemsPerPage);
  const paginatedBooths = filteredBooths.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold uppercase tracking-wide text-primary">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">{t('description')}</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> {t('addBooth')}
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBooth ? t('editBooth') : t('addNewBooth')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="boothNo">{t('boothNumber')} *</Label>
                  <Input 
                    id="boothNo" 
                    value={formData.boothNo} 
                    onChange={e => setFormData({...formData, boothNo: e.target.value})}
                    required 
                    placeholder={t('egB101')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">{t('area')}</Label>
                  <Input 
                    id="area" 
                    value={formData.area} 
                    onChange={e => setFormData({...formData, area: e.target.value})}
                    placeholder={t('egNorthZone')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('boothName')} *</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                  placeholder={t('egGovtSchool')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('linkedKilais')}</Label>
                <MultiSelectDropdown 
                  options={kilais || []}
                  selected={formData.kilaiIds}
                  onChange={(val) => setFormData({...formData, kilaiIds: val})}
                  placeholder="Select kilais..."
                />
              </div>

              <div className="space-y-2">
                <Label>{t('boothAgents')}</Label>
                <MultiSelectDropdown 
                  options={cadres || []}
                  selected={formData.agentIds}
                  onChange={(val) => setFormData({...formData, agentIds: val})}
                  placeholder="Select agents..."
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maleCount">{t('male')}</Label>
                  <Input 
                    id="maleCount" 
                    type="number" 
                    min="0"
                    value={formData.maleCount} 
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData({...formData, maleCount: val, totalCount: val + formData.femaleCount + formData.thirdGenderCount});
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="femaleCount">{t('female')}</Label>
                  <Input 
                    id="femaleCount" 
                    type="number" 
                    min="0"
                    value={formData.femaleCount} 
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData({...formData, femaleCount: val, totalCount: formData.maleCount + val + formData.thirdGenderCount});
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thirdGenderCount">{t('thirdGender')}</Label>
                  <Input 
                    id="thirdGenderCount" 
                    type="number" 
                    min="0"
                    value={formData.thirdGenderCount} 
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData({...formData, thirdGenderCount: val, totalCount: formData.maleCount + formData.femaleCount + val});
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalCount">{t('total')}</Label>
                  <Input 
                    id="totalCount" 
                    type="number" 
                    min="0"
                    value={formData.totalCount} 
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{tCommon('cancel')}</Button>
                <Button type="submit" className="bg-primary text-white" disabled={createBooth.isPending || updateBooth.isPending}>
                  {editingBooth ? t('updateBooth') : t('saveBooth')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Booth Dialog */}
        <Dialog open={!!viewingBooth} onOpenChange={(open) => !open && setViewingBooth(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">{viewingBooth?.name}</DialogTitle>
              <p className="text-muted-foreground font-medium">{t('boothHeader')} {viewingBooth?.boothNo} {viewingBooth?.area ? `• ${viewingBooth?.area}` : ''}</p>
            </DialogHeader>
            
            <div className="space-y-6 mt-2">
              {/* Linked Kilais */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground/80">{t('linkedKilais')}</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingBooth?.kilais?.length ? viewingBooth.kilais.map((k: any) => (
                    <span key={k.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                      {k.name}
                    </span>
                  )) : (
                    <span className="text-sm text-muted-foreground italic bg-muted px-3 py-1 rounded-md">{t('noKilaisLinked')}</span>
                  )}
                </div>
              </div>

              {/* Agents */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground/80">{t('agentsCadres')}</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingBooth?.agents?.length ? viewingBooth.agents.map((a: any) => (
                    <span key={a.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                      {a.name}
                    </span>
                  )) : (
                    <span className="text-sm text-muted-foreground italic bg-muted px-3 py-1 rounded-md">No agents assigned</span>
                  )}
                </div>
              </div>

              {/* Demographics */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground/80">{t('demographics')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-3 text-center transition-all hover:scale-105">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">{t('male')}</div>
                    <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{viewingBooth?.maleCount || 0}</div>
                  </div>
                  <div className="bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900 rounded-lg p-3 text-center transition-all hover:scale-105">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">{t('female')}</div>
                    <div className="text-xl font-bold text-pink-700 dark:text-pink-400">{viewingBooth?.femaleCount || 0}</div>
                  </div>
                  <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-lg p-3 text-center transition-all hover:scale-105">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">{t('thirdGender')}</div>
                    <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{viewingBooth?.thirdGenderCount || 0}</div>
                  </div>
                  <div className="bg-muted/50 border rounded-lg p-3 text-center transition-all hover:scale-105">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">{t('total')}</div>
                    <div className="text-xl font-bold text-foreground">{viewingBooth?.totalCount || 0}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-6 mt-2 border-t border-border/50">
              <Button variant="outline" onClick={() => setViewingBooth(null)}>{t('close')}</Button>
            </div>
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
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('totalBooths')}</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">{booths?.length || 0}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-manjal/20 rounded-md text-amber-600 dark:text-manjal">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('totalVoters')}</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">
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
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('agentCoverage')}</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mt-1">
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
            placeholder={t('searchPlaceholder')} 
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="h-11 rounded-md px-6 font-medium border-primary/20 text-primary hover:bg-primary/5">{tCommon('exportCsv')}</Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden p-2">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-primary py-4">{t('boothHeader')}</TableHead>
              <TableHead className="font-semibold text-primary py-4">{t('linkedKilais')}</TableHead>
              <TableHead className="font-semibold text-primary py-4">{t('agentsCadres')}</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-center">{t('mf3rd')}</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-center">{t('totalCount')}</TableHead>
              <TableHead className="font-semibold text-primary py-4 text-right sticky right-0 z-10 bg-card border-l">{tCommon('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('loading')}</TableCell>
              </TableRow>
            ) : paginatedBooths.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('noBooths')}</TableCell>
              </TableRow>
            ) : (
              paginatedBooths.map((booth: any) => (
                <TableRow key={booth.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                  <TableCell className="py-4">
                    <Tooltip>
                      <TooltipTrigger onClick={() => setViewingBooth(booth)}>
                        <div className="flex flex-col items-start text-left cursor-pointer max-w-[200px] sm:max-w-[300px] lg:max-w-[450px]">
                          <span className="font-bold text-sm md:text-base text-foreground underline decoration-dashed decoration-primary/30 underline-offset-4 hover:text-primary transition-colors truncate w-full block">
                            {booth.name 
                              ? `${booth.boothNo} - ${shortenBoothName(booth.name)}`
                              : booth.boothNo}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[350px] whitespace-normal">
                        <p className="font-semibold text-sm mb-1">{booth.name}</p>
                        <p className="text-xs text-muted-foreground">{booth.area || t('noAreaSpecified')}</p>
                      </TooltipContent>
                    </Tooltip>
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
                      {!booth.agents?.length && <span className="text-xs text-muted-foreground italic">{t('noneAssigned')}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4 font-medium text-muted-foreground">
                    <span className="text-blue-600">{booth.maleCount}</span> / <span className="text-pink-600">{booth.femaleCount}</span> / <span className="text-purple-600">{booth.thirdGenderCount}</span>
                  </TableCell>
                  <TableCell className="text-center font-bold text-foreground py-4">
                    {booth.totalCount}
                  </TableCell>
                  <TableCell className="text-right py-4 sticky right-0 z-10 bg-card group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/50 border-l">
                    <div className="flex justify-end gap-2 transition-opacity">
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

        {/* Pagination Controls */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-primary/10 bg-primary/5">
            <div className="text-sm text-muted-foreground font-medium text-center sm:text-left">
              {t('showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('to')} {Math.min(currentPage * itemsPerPage, filteredBooths.length)} {t('of')} {filteredBooths.length} {t('entries')}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-card hover:bg-primary hover:text-primary-foreground border-primary/20 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('previous')}
              </Button>
              <div className="text-sm font-semibold text-primary px-2">
                {t('page')} {currentPage} {t('of')} {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="bg-card hover:bg-primary hover:text-primary-foreground border-primary/20 transition-colors"
              >
                {t('next')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
