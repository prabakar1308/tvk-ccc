'use client';

import { useParams } from 'next/navigation';
import { useUnion } from '@/hooks/use-unions';
import { ArrowLeft, Store, Building2, Users } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useState } from 'react';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function UnionDetailsPage() {
  const { id } = useParams();
  const { data: union, isLoading } = useUnion(id as string);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-medium">Loading union details...</div>;
  if (!union) return <div className="p-8 text-center text-red-500 font-bold">Union not found</div>;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/unions" className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">{union.name}</h1>
            <p className="text-muted-foreground font-medium mt-1">
              {union.district?.name || 'Unknown'} District • {union.group === 'KURINJIPADI' ? 'Kurinjipadi' : union.group === 'CUDDALORE' ? 'Cuddalore' : union.group}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> Register Cadre
        </Button>
      </div>

      {/* Union Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Kilais */}
        <Link 
          href={`/kilais?union=${(union as any).id || (union as any)._id}`} 
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-3 sm:gap-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer block text-left"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">Total Kilais</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{union._count?.kilais || 0}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">In this union</p>
          </div>
        </Link>

        {/* Total Booths */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">Total Booths</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{union.totalBooths || 0}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">In this union</p>
          </div>
        </div>

        {/* Total Cadres */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-gray-800">Total Cadres</p>
            <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight">{(union._count?.cadres || 0).toLocaleString()}</h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1">Active in this union</p>
          </div>
        </div>
      </div>

      {/* Cadres Grid */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 tracking-wide mb-6">Union Cadres</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {(union.unionCadres || []).map((cadre, index) => {
            const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || 'Member';
            const designation = rawRole.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
            const photoUrl = cadre.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cadre.name)}&background=8F0A1B&color=fff&size=128`;
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
                  <img src={photoUrl} alt={cadre.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-[14px] sm:text-[15px] text-gray-900 text-center leading-tight mb-1">{cadre.name}</h3>
                <p className={`text-[11px] sm:text-[12px] font-semibold text-center ${
                  highlight ? "text-[#8F0A1B] bg-[#8F0A1B]/10 px-2 py-0.5 rounded-full mt-1" : "text-[#8F0A1B]"
                }`}>{designation}</p>
              </div>
            );
          })}
        </div>
      </div>

      
      <CadreFormDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultLevel="UNION"
        defaultUnionId={union.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['unions', id] });
        }}
      />
    </div>
  );
}
