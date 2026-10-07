'use client';

import { useParams } from 'next/navigation';
import { useKilai } from '@/hooks/use-kilais';
import { ArrowLeft, MapPin, Building2, Users, Tent, Phone } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useState } from 'react';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { CadreViewDialog } from '@/components/cadre-view-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';

export default function KilaiDetailsPage() {
  const { id } = useParams();
  const { data: kilai, isLoading } = useKilai(id as string);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [callConfirmation, setCallConfirmation] = useState<{name: string, phone: string} | null>(null);
  const [viewingCadre, setViewingCadre] = useState<any | null>(null);
  const queryClient = useQueryClient();

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-medium">Loading kilai details...</div>;
  if (!kilai) return <div className="p-8 text-center text-red-500 font-bold">Kilai not found</div>;

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
              Union: {kilaiData.union?.name || 'Unknown'}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> Register Administrator
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
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">Linked Booths</p>
            {kilaiData.booths && kilaiData.booths.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {kilaiData.booths.map((booth: any) => (
                  <span key={booth.id || booth._id} className="text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {booth.boothNo} {booth.name && `- ${booth.name}`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">No booths linked</p>
            )}
          </div>
        </div>

        {/* Linked Areas */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-start gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">Linked Villages / Areas</p>
            {kilaiData.villages && kilaiData.villages.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {kilaiData.villages.map((area: string) => (
                  <span key={area} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">No areas linked</p>
            )}
          </div>
        </div>

        {/* Total Administrators */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">Total Administrators</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{(kilaiData.kilaiCadres?.length || 0).toLocaleString()}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">Active in this kilai</p>
          </div>
        </div>
      </div>

      {/* Cadres Grid */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 tracking-wide mb-6">Kilai Cadres (Office Bearers)</h2>
        
        {!kilaiData.kilaiCadres || kilaiData.kilaiCadres.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No administrators registered for this Kilai yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {kilaiData.kilaiCadres.map((cadre: any, index: number) => {
              const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || 'Member';
              const designation = rawRole.replace(/_/g, ' ').replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
              const photoUrl = cadre.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cadre.name || 'User')}&background=8F0A1B&color=fff&size=128`;
              const highlight = index === 0 && rawRole.includes('SECRETARY'); // Example highlight logic
              
              return (
                <div 
                  key={cadre.id || index} 
                  onClick={() => setViewingCadre(cadre)}
                  className={`flex flex-col items-center pt-6 px-4 pb-5 rounded-2xl border-2 transition-all duration-300 group cursor-pointer h-full relative overflow-hidden hover:-translate-y-1 shadow-md hover:shadow-xl dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] ${
                    highlight 
                      ? "bg-gradient-to-b from-[#8F0A1B]/10 to-zinc-50/90 dark:to-zinc-900/90 backdrop-blur-sm border-[#8F0A1B]/40 hover:border-[#8F0A1B]" 
                      : "bg-zinc-50/90 backdrop-blur-sm hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-900 border-[#f5e3e3] dark:border-zinc-800 hover:border-[#8F0A1B] dark:hover:border-[#8F0A1B]"
                  }`}
                >
                  {/* Top Accent Line */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 transition-opacity ${highlight ? "bg-gradient-to-r from-[#8F0A1B]/80 to-[#8F0A1B] opacity-100" : "bg-gradient-to-r from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-600 opacity-0 group-hover:opacity-100"}`} />

                  {highlight && (
                    <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-[#8F0A1B]/20 to-transparent pointer-events-none">
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#8F0A1B] animate-pulse"></div>
                    </div>
                  )}

                  <div className="relative mb-4 mt-2">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 shadow-lg z-10 relative ${
                      highlight ? "border-[#8F0A1B]/20" : "border-white dark:border-zinc-800"
                    }`}>
                      <img src={photoUrl} alt={cadre.name || 'Administrator'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className={`absolute inset-0 rounded-full border-2 scale-[1.15] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${highlight ? "border-[#8F0A1B]/40" : "border-gray-300 dark:border-zinc-600"}`}></div>
                  </div>

                  <h3 className="font-extrabold text-[15px] sm:text-[17px] text-gray-900 dark:text-zinc-100 text-center leading-tight mb-2 group-hover:text-[#8F0A1B] transition-colors">{cadre.name || 'Unknown Name'}</h3>
                  
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-700 to-transparent my-1" />

                  <div className="mt-3 w-full flex flex-col items-center gap-2">
                    <p className={`text-[11px] sm:text-[12px] font-semibold text-center inline-block px-3 py-1 rounded-full uppercase tracking-wider ${
                      highlight ? "text-[#8F0A1B] bg-[#8F0A1B]/10" : "text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800"
                    }`}>{designation}</p>
                    
                    {cadre.phone && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCallConfirmation({ name: cadre.name || 'Unknown Name', phone: cadre.phone }); }} className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-gray-600 dark:text-zinc-400 hover:text-[#8F0A1B] dark:hover:text-[#8F0A1B] transition-colors mt-1">
                        <Phone className="w-3.5 h-3.5" />
                        {cadre.phone}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CadreFormDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultLevel="KILAI"
        defaultKilaiId={kilaiData.id}
        defaultUnionId={kilaiData.unionId}
        defaultBoothNo={kilaiData.booths?.[0]?.boothNo}
        defaultArea={kilaiData.villages?.[0]}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['kilais', id] });
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
    </div>
  );
}
