'use client';

import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useKilai } from '@/hooks/use-kilais';
import { getOrgUnitName } from '@/lib/org-unit-translations';
import { ArrowLeft, MapPin, Building2, Users, Tent, Phone } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useState } from 'react';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { CadreViewDialog } from '@/components/cadre-view-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { CadreCard } from '@/components/cadre-card';
import { useDeleteCadre } from '@/hooks/use-cadres';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function KilaiDetailsPage() {
  const { id } = useParams();
  const locale = useLocale();
  const { data: kilai, isLoading } = useKilai(id as string);
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

  const handleDelete = (e: React.MouseEvent, cadreId: string) => {
    e.stopPropagation();
    setDeleteConfirmation(cadreId);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-medium">{locale === 'ta' ? 'கிளை விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading kilai details...'}</div>;
  if (!kilai) return <div className="p-8 text-center text-red-500 font-bold">{locale === 'ta' ? 'கிளை கிடைக்கவில்லை' : 'Kilai not found'}</div>;

  const kilaiData: any = kilai;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/kilais" className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-gray-900">{kilaiData.name} {kilaiData.tamilName && <span className="text-xl font-normal text-muted-foreground">({kilaiData.tamilName})</span>}</h1>
            <p className="text-muted-foreground font-medium mt-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {locale === 'ta' ? 'அமைப்பு அலகு' : 'Union'}: {getOrgUnitName(kilaiData.union, locale) || (locale === 'ta' ? 'தெரியவில்லை' : 'Unknown')}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> {locale === 'ta' ? 'நிர்வாகியை பதிவு செய்' : 'Register Administrator'}
        </Button>
      </div>

      {/* Kilai Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Linked Booths */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-start gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
            <Tent className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">
              {locale === 'ta' ? 'இணைக்கப்பட்ட சாவடிகள்' : 'Linked Booths'}
            </p>
            {kilaiData.booths && kilaiData.booths.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {kilaiData.booths.map((booth: any) => (
                  <span key={booth.id || booth._id} className="text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {booth.boothNo} {booth.name && `- ${booth.name}`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                {locale === 'ta' ? 'சாவடிகள் இணைக்கப்படவில்லை' : 'No booths linked'}
              </p>
            )}
          </div>
        </div>

        {/* Linked Areas */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-start gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">
              {locale === 'ta' ? 'இணைக்கப்பட்ட கிராமங்கள் / பகுதிகள்' : 'Linked Villages / Areas'}
            </p>
            {kilaiData.villages && kilaiData.villages.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {kilaiData.villages.map((area: string) => (
                  <span key={area} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                {locale === 'ta' ? 'பகுதிகள் இணைக்கப்படவில்லை' : 'No areas linked'}
              </p>
            )}
          </div>
        </div>

        {/* Total Administrators */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">
              {locale === 'ta' ? 'மொத்த நிர்வாகிகள்' : 'Total Administrators'}
            </p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{(kilaiData.kilaiCadres?.length || 0).toLocaleString()}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">
              {locale === 'ta' ? 'இந்த கிளையில் செயலில் உள்ளனர்' : 'Active in this kilai'}
            </p>
          </div>
        </div>
      </div>

      {/* Cadres Grid */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 tracking-wide mb-6">
          {locale === 'ta' ? 'கிளை நிர்வாகிகள் (பொறுப்பாளர்கள்)' : 'Kilai Cadres (Office Bearers)'}
        </h2>
        
        {!kilaiData.kilaiCadres || kilaiData.kilaiCadres.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 font-medium bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            {locale === 'ta' ? 'இந்த கிளைக்கு இதுவரை நிர்வாகிகள் பதிவு செய்யப்படவில்லை.' : 'No administrators registered for this Kilai yet.'}
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {kilaiData.kilaiCadres.map((cadre: any, index: number) => {
              const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || 'Member';
              const isSecretary = rawRole.toUpperCase().includes('SECRETARY') || rawRole.toUpperCase().includes('PRESIDENT');
              const highlight = index === 0 && isSecretary;

              return (
                <CadreCard
                  key={cadre.id || index}
                  cadre={cadre}
                  highlight={highlight}
                  minWidth="240px"
                  showLocation={true}
                  onView={(c) => setViewingCadre(c)}
                  onEdit={(e, c) => handleOpenEdit(e, c)}
                  onDelete={(e, cadreId) => handleDelete(e, cadreId)}
                  onCall={(person) => setCallConfirmation(person)}
                />
              );
            })}
          </div>
        )}
      </div>

      <CadreFormDialog 
        isOpen={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingId(null);
        }}
        editingId={editingId}
        cadres={kilaiData.kilaiCadres}
        defaultLevel="KILAI"
        lockLevel={true}
        defaultKilaiId={kilaiData.id}
        defaultUnionId={kilaiData.unionId}
        defaultBoothNo={kilaiData.booths?.[0]?.boothNo}
        defaultArea={kilaiData.villages?.[0]}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['kilais'] });
        }}
      />

      <CadreViewDialog
        isOpen={!!viewingCadre}
        onOpenChange={(open) => !open && setViewingCadre(null)}
        cadre={viewingCadre}
      />

      <CallConfirmationDialog 
        person={callConfirmation} 
        onOpenChange={(open) => !open && setCallConfirmation(null)} 
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{locale === 'ta' ? 'நிர்வாகியை நீக்கு' : 'Delete Administrator'}</DialogTitle>
            <DialogDescription className="pt-2">
              {locale === 'ta' 
                ? 'இந்த நிர்வாகியை நிச்சயமாக நீக்க விரும்புகிறீர்களா? இந்த செயலை மாற்ற முடியாது.' 
                : 'Are you sure you want to delete this administrator? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>
              {locale === 'ta' ? 'ரத்துசெய்' : 'Cancel'}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (deleteConfirmation) {
                  deleteMutation.mutate(deleteConfirmation, {
                    onSuccess: () => {
                      setDeleteConfirmation(null);
                      queryClient.invalidateQueries({ queryKey: ['kilais'] });
                    }
                  });
                }
              }}
            >
              {locale === 'ta' ? 'நீக்கு' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
