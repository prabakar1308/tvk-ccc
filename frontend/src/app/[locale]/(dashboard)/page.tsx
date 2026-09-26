'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, Building2, MapPin, ArrowRight, UserCog, Network, GraduationCap, Megaphone, BarChart2, FileText } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Link } from '@/i18n/routing';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { useCadres } from '@/hooks/use-cadres';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: districtCadres, isLoading: cadresLoading } = useCadres({ level: 'DISTRICT' });
  
  const secretary = districtCadres?.find(c => c.role === 'SECRETARY' || c.role?.toLowerCase() === 'secretary') || districtCadres?.[0];
  const otherCadres = districtCadres?.filter(c => c.id !== secretary?.id) || [];

  return (
    <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
      {/* Hero Banner Image */}
      <div className="w-full h-[180px] sm:h-[320px] rounded-[16px] sm:rounded-[24px] overflow-hidden shadow-sm relative bg-[#EBEBEB]">
        <img 
          src="/db_image_2.png" 
          alt="TVK Leaders" 
          className="w-full h-full object-cover object-top mix-blend-multiply opacity-90"
        />
        {/* We use mix-blend and opacity to make the background of image blend if it has a white bg, or just give a slight tint. The provided image already seems to have this grey tone background. */}
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Unions */}
        <Link href="/unions" className="block">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-3 sm:gap-4 hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
            <div className="flex-1 grid grid-cols-[1fr_auto] items-center sm:block">
              <p className="text-[16px] sm:text-[16px] font-semibold text-gray-800 col-start-1 row-start-1">Total Unions</p>
              <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight col-start-2 row-start-1 row-span-2 text-right sm:text-left">
                {statsLoading ? '...' : stats?.totalUnions || 0}
              </h3>
              <p className="text-[12px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1 col-start-1 row-start-2">Across the constituency</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 hidden sm:block" />
          </div>
        </Link>

        {/* Card 2: Total Kilais */}
        <Link href="/kilais" className="block">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-3 sm:gap-4 hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
            <div className="flex-1 grid grid-cols-[1fr_auto] items-center sm:block">
              <p className="text-[16px] sm:text-[16px] font-semibold text-gray-800 col-start-1 row-start-1">Total Kilais</p>
              <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight col-start-2 row-start-1 row-span-2 text-right sm:text-left">
                {statsLoading ? '...' : stats?.totalKilais || 0}
              </h3>
              <p className="text-[12px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1 col-start-1 row-start-2">Registered kilais</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 hidden sm:block" />
          </div>
        </Link>

        {/* Card 3: Total Cadres */}
        <Link href="/cadres" className="block">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-3 sm:gap-4 hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
              <UserCog className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            </div>
            <div className="flex-1 grid grid-cols-[1fr_auto] items-center sm:block">
              <p className="text-[16px] sm:text-[16px] font-semibold text-gray-800 col-start-1 row-start-1">Total Cadres</p>
              <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight col-start-2 row-start-1 row-span-2 text-right sm:text-left">
                {statsLoading ? '...' : stats?.totalCadres || 0}
              </h3>
              <p className="text-[12px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1 col-start-1 row-start-2">Active cadres</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 hidden sm:block" />
          </div>
        </Link>

        {/* Card 4: Total Booths */}
        <Link href="/booths" className="block">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center gap-3 sm:gap-4 hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
            </div>
            <div className="flex-1 grid grid-cols-[1fr_auto] items-center sm:block">
              <p className="text-[16px] sm:text-[16px] font-semibold text-gray-800 col-start-1 row-start-1">Total Booths</p>
              <h3 className="text-[22px] sm:text-[28px] font-bold text-gray-900 leading-tight col-start-2 row-start-1 row-span-2 text-right sm:text-left">
                {statsLoading ? '...' : stats?.totalBooths || 0}
              </h3>
              <p className="text-[12px] sm:text-[11px] font-medium text-gray-500 mt-0.5 sm:mt-1 col-start-1 row-start-2">Across the constituency</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 hidden sm:block" />
          </div>
        </Link>
      </div>

      {/* Bottom Content Area */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-1">
        {/* Constituency Details */}
        {/* <div className="bg-[#FEFBF4] rounded-2xl p-8 shadow-sm border border-[#F2E8D5]">
          <div className="flex items-center gap-3 mb-8 text-[#8F0A1B] border-b border-[#F2E8D5] pb-4">
            <MapPin className="w-6 h-6 fill-[#8F0A1B] text-white" />
            <h2 className="text-[18px] font-bold tracking-wide">Kurinjipadi Assembly Constituency</h2>
            <div className="ml-auto flex items-center gap-1">
               <div className="w-1 h-1 rounded-full bg-[#8F0A1B] opacity-50"></div>
               <div className="w-2 h-2 rounded-full bg-[#8F0A1B] opacity-50 flex items-center justify-center"><div className="w-1 h-1 bg-[#8F0A1B] rounded-full"></div></div>
               <div className="w-1 h-1 rounded-full bg-[#8F0A1B] opacity-50"></div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-10 items-center">
       
            <div className="w-[200px] h-[220px] shrink-0 relative flex flex-col items-center justify-center">
              
              <svg viewBox="0 0 100 120" className="absolute inset-0 w-full h-full text-[#FDEAB3] drop-shadow-sm">
                <path fill="currentColor" stroke="#F1D17A" strokeWidth="1" d="M30,10 L50,5 L70,15 L80,30 L90,45 L85,60 L95,75 L80,90 L60,110 L45,115 L25,105 L15,90 L5,70 L10,50 L5,35 L15,20 Z" />
              </svg>
              <div className="relative z-10 flex flex-col items-center mt-4">
                <MapPin className="w-8 h-8 text-[#8F0A1B] fill-[#8F0A1B]" />
                <div className="w-2 h-1 bg-black/20 rounded-[50%] mt-1 blur-[1px]"></div>
                <p className="text-[#8F0A1B] font-bold text-[13px] mt-2">Kurinjipadi</p>
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-5">
              <div className="flex justify-between items-center py-2 border-b border-black/5">
                <div className="flex items-center gap-3 text-gray-600">
                  <UserCog className="w-5 h-5 text-[#8F0A1B]" />
                  <span className="text-[14px] font-medium">Total Cadres</span>
                </div>
                <span className="font-bold text-gray-900 text-[15px]">2,45,678</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-black/5">
                <div className="flex items-center gap-3 text-gray-600">
                  <Store className="w-5 h-5 text-[#8F0A1B]" />
                  <span className="text-[14px] font-medium">Total Kilais</span>
                </div>
                <span className="font-bold text-gray-900 text-[15px]">412</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-black/5">
                <div className="flex items-center gap-3 text-gray-600">
                  <Building2 className="w-5 h-5 text-[#8F0A1B]" />
                  <span className="text-[14px] font-medium">Total Booths</span>
                </div>
                <span className="font-bold text-gray-900 text-[15px]">12</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-black/5">
                <div className="flex items-center gap-3 text-gray-600">
                  <Users className="w-5 h-5 text-[#8F0A1B]" />
                  <span className="text-[14px] font-medium">Total Representatives</span>
                </div>
                <span className="font-bold text-gray-900 text-[15px]">77</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-3 text-gray-600">
                  <svg className="w-5 h-5 text-[#8F0A1B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                  <span className="text-[14px] font-medium">Total Unions</span>
                </div>
                <span className="font-bold text-gray-900 text-[15px]">3</span>
              </div>
            </div>
          </div>
        </div> */}

        {/* District Cadres Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
             <h2 className="text-[16px] sm:text-[18px] font-bold text-gray-900 tracking-wide">District Cadres</h2>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            
            {/* Fixed Secretary Tile */}
            <div className="w-full lg:w-1/3 xl:w-1/4 shrink-0">
              {secretary ? (
                <div className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl border bg-gradient-to-b from-[#8F0A1B]/10 to-[#8F0A1B]/5 border-[#8F0A1B]/30 shadow-sm relative h-full">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-[#8F0A1B]/20 to-transparent rounded-tr-xl">
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#8F0A1B] animate-pulse"></div>
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 sm:mb-4 border-2 shadow-sm border-[#8F0A1B]">
                    <img src={secretary.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(secretary.name)}&background=8F0A1B&color=fff&size=128`} alt={secretary.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-bold text-[14px] sm:text-[16px] text-gray-900 text-center leading-tight mb-1">{secretary.name}</h3>
                  <p className="text-[11px] sm:text-[12px] font-bold text-[#8F0A1B] bg-[#8F0A1B]/10 px-3 py-1 rounded-full mt-1">{secretary.role || 'Secretary'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl border border-dashed border-gray-300 h-full text-center">
                  <p className="text-gray-500 font-medium">No district cadres found.</p>
                </div>
              )}
            </div>

            {/* Other Cadres Carousel */}
            {otherCadres.length > 0 && (
              <div className="flex-1 min-w-0 px-8 sm:px-12 relative flex flex-col justify-center">
                <Carousel
                  opts={{
                    align: "start",
                    loop: false,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {otherCadres.map((cadre, index) => (
                      <CarouselItem key={index} className="pl-2 md:pl-4 basis-[100%] sm:basis-1/2 md:basis-1/3 lg:basis-1/2 xl:basis-1/3">
                        <div className="p-1 h-full">
                          <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-[#F8F9FA] rounded-xl border border-gray-100 hover:border-[#8F0A1B]/20 hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 sm:mb-4 border-2 border-white shadow-sm group-hover:border-[#8F0A1B] transition-colors">
                              <img src={cadre.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cadre.name)}&background=8F0A1B&color=fff&size=128`} alt={cadre.name} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="font-bold text-[14px] sm:text-[15px] text-gray-900 text-center leading-tight mb-1">{cadre.name}</h3>
                            <p className="text-[11px] sm:text-[12px] font-semibold text-[#8F0A1B] text-center">{cadre.role || 'Cadre'}</p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="flex -left-4 sm:-left-6 lg:-left-8" />
                  <CarouselNext className="flex -right-4 sm:-right-6 lg:-right-8" />
                </Carousel>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
