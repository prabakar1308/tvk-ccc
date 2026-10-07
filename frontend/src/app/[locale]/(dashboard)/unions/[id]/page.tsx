'use client';

import { useParams } from 'next/navigation';
import { useUnion } from '@/hooks/use-unions';
import { ArrowLeft, Store, Building2, Users, Phone, Edit2, Trash2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useDeleteCadre } from '@/hooks/use-cadres';
import { useState } from 'react';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { CadreViewDialog } from '@/components/cadre-view-dialog';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function UnionDetailsPage() {
  const { id } = useParams();
  const { data: union, isLoading } = useUnion(id as string);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [callConfirmation, setCallConfirmation] = useState<{name: string, phone: string} | null>(null);
  const [viewingCadre, setViewingCadre] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteCadre();

  const handleOpenEdit = (e: React.MouseEvent, cadre: any) => {
    e.stopPropagation();
    setEditingId(cadre.id);
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmation(id);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-medium">Loading org unit details...</div>;
  if (!union) return <div className="p-8 text-center text-red-500 font-bold">Org unit not found</div>;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/unions" className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-gray-900">{union.name}</h1>
            <p className="text-muted-foreground font-medium mt-1">
              {union.district?.name || 'Unknown'} District • {union.group === 'KURINJIPADI' ? 'Kurinjipadi' : union.group === 'CUDDALORE' ? 'Cuddalore' : union.group} • {union.unitType === 'TOWN_PANCHAYAT' ? 'Town Panchayat' : union.unitType ? union.unitType.charAt(0) + union.unitType.slice(1).toLowerCase() : 'Union'}
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> Register Administrator
        </Button>
      </div>

      {/* Union Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Kilais */}
        <Link 
          href={`/kilais?union=${(union as any).id || (union as any)._id}`} 
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 dark:border-primary/30 shadow-md hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer flex items-center gap-3 sm:gap-4 text-left"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">Total Kilais</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{union._count?.kilais || 0}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">In this org unit</p>
          </div>
        </Link>

        {/* Total Booths */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 dark:border-primary/30 shadow-md flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">Total Booths</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{union.totalBooths || 0}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">In this org unit</p>
          </div>
        </div>

        {/* Total Administrators */}
        <Link href={`/cadres?filterLevel=UNION&unionId=${union.id}&includeKilai=true`} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 dark:border-primary/30 shadow-md flex items-center gap-3 sm:gap-4 hover:shadow-lg transition-all hover:-translate-y-1 hover:border-primary/50 cursor-pointer">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">Total Administrators</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{(union._count?.cadres || 0).toLocaleString()}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">Active across this org unit</p>
          </div>
        </Link>
      </div>

      {/* Areas Covered */}
      {union.areasCovered && union.areasCovered.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900 tracking-wide">Areas Covered</h2>
            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-sm font-bold border border-primary/20">
              {union.areasCovered.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {union.areasCovered.map((area: string, idx: number) => (
              <span key={idx} className="inline-flex items-center text-xs font-bold tracking-wide uppercase bg-gray-50 dark:bg-zinc-800/50 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700/50 rounded-md px-3 py-1.5 shadow-sm hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-colors cursor-default">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cadres Grid */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-gray-900 tracking-wide">Org Unit Administrators</h2>
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-sm font-bold border border-primary/20">
            {union.unionCadres?.length || 0}
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {(union.unionCadres || []).map((cadre, index) => {
            const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || 'Member';
            const designation = rawRole.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
            const photoUrl = cadre.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cadre.name)}&background=8F0A1B&color=fff&size=128`;
            const highlight = index === 0 && rawRole.includes('SECRETARY'); // Example highlight logic
            
            return (
              <div 
                key={cadre.id || index} 
                onClick={() => setViewingCadre(cadre)}
                className={`flex flex-col items-center pt-6 px-4 pb-5 rounded-2xl border-2 transition-all duration-300 group cursor-pointer h-full relative overflow-hidden hover:-translate-y-1 shadow-md hover:shadow-xl dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] ${
                  highlight 
                  ? "bg-gradient-to-b from-[#8F0A1B]/10 to-zinc-50/90 dark:to-zinc-900/90 backdrop-blur-sm border-[#8F0A1B]/40 hover:border-[#8F0A1B]" 
                  : "bg-zinc-50/90 backdrop-blur-sm hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-900 border-[#f5e3e3] dark:border-zinc-800 hover:border-[#8F0A1B] dark:hover:border-[#8F0A1B]"
              }`}>
                {/* Top Accent Line */}
                <div className={`absolute top-0 left-0 w-full h-1.5 transition-opacity ${highlight ? "bg-gradient-to-r from-[#8F0A1B]/80 to-[#8F0A1B] opacity-100" : "bg-gradient-to-r from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-600 opacity-0 group-hover:opacity-100"}`} />

                {/* Desktop Actions (Top Right Hover) */}
                <div className="hidden md:flex absolute top-3 right-3 gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 z-10">
                  <Button onClick={(e) => handleOpenEdit(e, cadre)} variant="ghost" size="icon" className="h-8 w-8 text-[#8F0A1B] hover:text-white hover:bg-[#8F0A1B] rounded-full transition-colors bg-[#8F0A1B]/5">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button onClick={(e) => handleDelete(e, cadre.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-white hover:bg-destructive rounded-full transition-colors bg-destructive/5">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {highlight && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-[#8F0A1B]/20 to-transparent pointer-events-none">
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#8F0A1B] animate-pulse"></div>
                  </div>
                )}
                
                <div className="relative mb-4 mt-2">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 shadow-lg z-10 relative ${
                    highlight ? "border-[#8F0A1B]/20" : "border-white dark:border-zinc-800"
                  }`}>
                    <img src={photoUrl} alt={cadre.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className={`absolute inset-0 rounded-full border-2 scale-[1.15] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${highlight ? "border-[#8F0A1B]/40" : "border-gray-300 dark:border-zinc-600"}`}></div>
                </div>
                
                <h3 className="font-extrabold text-[15px] sm:text-[17px] text-gray-900 dark:text-zinc-100 text-center leading-tight mb-2 group-hover:text-[#8F0A1B] transition-colors">{cadre.name}</h3>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-700 to-transparent my-1" />

                <div className="mt-3 w-full flex flex-col items-center gap-2">
                  <p className={`text-[11px] sm:text-[12px] font-semibold text-center inline-block px-3 py-1 rounded-full uppercase tracking-wider ${
                    highlight ? "text-[#8F0A1B] bg-[#8F0A1B]/10" : "text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800"
                  }`}>{designation}</p>
                  
                  {cadre.phone && (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCallConfirmation({ name: cadre.name, phone: cadre.phone || '' }); }} className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-gray-600 dark:text-zinc-400 hover:text-[#8F0A1B] dark:hover:text-[#8F0A1B] transition-colors mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      {cadre.phone}
                    </button>
                  )}
                </div>

                {/* Mobile Actions (Bottom Inline) */}
                <div className="flex md:hidden w-full justify-center gap-6 mt-5 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <Button onClick={(e) => handleOpenEdit(e, cadre)} variant="ghost" size="icon" className="h-9 w-9 text-[#8F0A1B] bg-[#8F0A1B]/5 hover:bg-[#8F0A1B]/10 rounded-full">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button onClick={(e) => handleDelete(e, cadre.id)} variant="ghost" size="icon" className="h-9 w-9 text-destructive bg-destructive/5 hover:bg-destructive/10 rounded-full">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      
      <CadreFormDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingId={editingId}
        cadres={union.unionCadres}
        defaultLevel="UNION"
        defaultUnionId={union.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['unions', id] });
        }}
      />

      <CadreViewDialog
        isOpen={!!viewingCadre}
        onOpenChange={(open) => !open && setViewingCadre(null)}
        cadre={viewingCadre}
      />

      {/* Call Confirmation Dialog */}
      <CallConfirmationDialog 
        person={callConfirmation} 
        onOpenChange={(open) => !open && setCallConfirmation(null)} 
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Administrator</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this administrator? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (deleteConfirmation) {
                  deleteMutation.mutate(deleteConfirmation, {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ['unions', union?.id] });
                      setDeleteConfirmation(null);
                    }
                  });
                }
              }}
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
