'use client';

import { useParams } from 'next/navigation';
import { useKilai } from '@/hooks/use-kilais';
import { ArrowLeft, MapPin, Building2, Users, Tent } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useState } from 'react';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function KilaiDetailsPage() {
  const { id } = useParams();
  const { data: kilai, isLoading } = useKilai(id as string);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">{kilaiData.name} {kilaiData.tamilName && <span className="text-xl font-normal text-muted-foreground">({kilaiData.tamilName})</span>}</h1>
            <p className="text-muted-foreground font-medium mt-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              Union: {kilaiData.union?.name || 'Unknown'}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> Register Cadre
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
                  <span key={booth.id || booth._id} className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
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

        {/* Total Cadres */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">Total Cadres</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{(kilaiData.kilaiCadres?.length || 0).toLocaleString()}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">Active in this kilai</p>
          </div>
        </div>
      </div>

      {/* Cadres Grid */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 tracking-wide mb-6">Kilai Cadres (Office Bearers)</h2>
        
        {!kilaiData.kilaiCadres || kilaiData.kilaiCadres.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No cadres registered for this Kilai yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {kilaiData.kilaiCadres.map((cadre: any, index: number) => {
              const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || 'Member';
              const designation = rawRole.replace(/_/g, ' ').replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
              const photoUrl = cadre.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cadre.name || 'User')}&background=8F0A1B&color=fff&size=128`;
              const highlight = index === 0 && rawRole.includes('SECRETARY'); // Example highlight logic
              
              return (
                <div key={cadre.id || index} className={`flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl border hover:shadow-md transition-all duration-300 group cursor-pointer h-full ${
                  highlight 
                    ? "bg-gradient-to-b from-[#8F0A1B]/10 to-[#8F0A1B]/5 border-[#8F0A1B]/30 hover:border-[#8F0A1B]/50 shadow-sm relative overflow-hidden" 
                    : "bg-[#F8F9FA] border-gray-100 hover:border-[#8F0A1B]/20"
                }`}>
                  {highlight && (
                    <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-[#8F0A1B]/20 to-transparent">
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#8F0A1B] animate-pulse"></div>
                    </div>
                  )}
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 sm:mb-4 border-2 shadow-sm transition-colors ${
                    highlight ? "border-[#8F0A1B]" : "border-white group-hover:border-[#8F0A1B]"
                  }`}>
                    <img src={photoUrl} alt={cadre.name || 'Cadre'} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-bold text-[14px] sm:text-[15px] text-gray-900 text-center leading-tight mb-1">{cadre.name || 'Unknown Name'}</h3>
                  <p className={`text-[11px] sm:text-[12px] font-semibold text-center ${
                    highlight ? "text-[#8F0A1B] bg-[#8F0A1B]/10 px-2 py-0.5 rounded-full mt-1" : "text-[#8F0A1B]"
                  }`}>{designation}</p>
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
    </div>
  );
}
