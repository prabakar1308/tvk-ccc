'use client';

import { useState } from 'react';
import Image from 'next/image';
import dbImageMobile from '../../../../public/db_image_mobile.png';
import dbImageTablet from '../../../../public/db_image_tablet.png';
import dbImageDesktop from '../../../../public/db_image_desktop.png';
import dbImageDesktopLarge from '../../../../public/db_image_desktop_large.png';
import { 
  Users, Store, Building2, Building, MapPin, ArrowRight, 
  Network, Megaphone, BarChart2, Phone, 
  ShieldCheck, UserCheck, Layers, Sparkles, ChevronRight
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { useCadres } from '@/hooks/use-cadres';
import { useUser } from '@/contexts/user-context';
import { UserAvatar } from '@/components/ui/user-avatar';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { CadreViewDialog } from '@/components/cadre-view-dialog';
import { translatePersonNameToTamil, translateRoleToTamil } from '@/lib/name-translations';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const { user } = useUser();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: districtCadres, isLoading: cadresLoading } = useCadres({ level: 'DISTRICT' });
  
  const [callPerson, setCallPerson] = useState<{ name: string; phone: string } | null>(null);
  const [viewingCadre, setViewingCadre] = useState<any | null>(null);

  const userName = user?.name
    ? locale === 'ta'
      ? translatePersonNameToTamil(user.name)
      : user.name
    : null;

  const handleInitiateCall = (phone: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCallPerson({ phone, name });
  };
  
  const secretary = districtCadres?.find(c => c.role === 'SECRETARY' || c.role?.toLowerCase() === 'secretary') || districtCadres?.[0];
  const otherCadres = districtCadres?.filter(c => c.id !== secretary?.id) || [];

  return (
    <div className="space-y-6 sm:space-y-8 pt-2 sm:pt-4 pb-12 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
      {/* Simple Executive Welcome Bar */}
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#8F0A1B]/5 via-[#FFC72C]/10 to-transparent p-3.5 sm:p-4 rounded-2xl border border-[#8F0A1B]/15 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8F0A1B] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-[#FFC72C]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">
              {userName
                ? t('welcomeUser', { name: userName })
                : t('welcomeCadre')}
            </h2>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              {t('constituencySubtitle')}
            </p>
          </div>
        </div>

        {/* <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {t('commandCenterActive', { fallback: 'Live' })}
        </span> */}
      </div>

      {/* Hero Banner Image */}
      <div className="w-full rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-md relative bg-[#8F0A1B] border border-[#8F0A1B]/20 group">
        {/* Mobile View Image (< 640px) */}
        <div className="relative aspect-[941/1672] w-full overflow-hidden block sm:hidden">
          <Image
            src={dbImageMobile}
            alt="TVK Leaders - வெற்றி தமிழ்நாடு"
            fill
            priority
            sizes="(max-width: 640px) 100vw, 420px"
            className="object-cover object-top group-hover:scale-[1.01] transition-transform duration-700"
          />
        </div>

        {/* Tablet View Image (640px - 1023px) */}
        <div className="relative aspect-[1586/992] w-full overflow-hidden hidden sm:block lg:hidden">
          <Image
            src={dbImageTablet}
            alt="TVK Leaders - வெற்றி தமிழ்நாடு"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 768px"
            className="object-cover object-top group-hover:scale-[1.01] transition-transform duration-700"
          />
        </div>

        {/* Desktop View Image (1024px - 1600px) */}
        <div className="relative aspect-[1945/808] w-full overflow-hidden hidden [@media(min-width:1024px)_and_(max-width:1600px)]:block">
          <Image
            src={dbImageDesktop}
            alt="TVK Leaders - வெற்றி தமிழ்நாடு"
            fill
            priority
            sizes="(max-width: 1600px) 100vw, 1400px"
            className="object-cover object-top group-hover:scale-[1.01] transition-transform duration-700"
          />
        </div>

        {/* Large Desktop View Image (> 1600px) */}
        <div className="relative aspect-[1942/809] w-full overflow-hidden hidden min-[1601px]:block">
          <Image
            src={dbImageDesktopLarge}
            alt="TVK Leaders - வெற்றி தமிழ்நாடு"
            fill
            priority
            sizes="(min-width: 1601px) 100vw, 1920px"
            className="object-cover object-top group-hover:scale-[1.01] transition-transform duration-700"
          />
        </div>
      </div>

      {/* Main KPI Stats Row - Matching Org Units Cards Design */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <div className="w-2 h-5 bg-[#8F0A1B] rounded-sm"></div>
            {t('constituencyOverview')}
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {t('acrossConstituency')}
          </span>
        </div>

        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4">
          {/* Card 1: Total Org Units */}
          <Link href="/unions" className="block h-full group/card cursor-pointer">
            <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden hover:-translate-y-1 p-5">
              {/* Ambient Accent Glow & Top Line */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 opacity-30 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] via-[#D97706] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center border transition-transform group-hover:scale-105 duration-300 bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {t('constituencyUnits')}
                  </span>
                </div>

                {/* Metric & Label */}
                <h3 className="font-extrabold text-[30px] sm:text-[34px] text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors my-1 tracking-tight">
                  {statsLoading ? '...' : (stats?.totalUnions || 0)}
                </h3>
                <h4 className="text-[15px] sm:text-[16px] font-bold text-zinc-800 dark:text-zinc-200">
                  {t('totalUnions')}
                </h4>
                <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
                  {t('unionsTownsActive')}
                </p>
              </div>

              {/* Bottom Quick Stats Pill Bar */}
              <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white font-bold text-[11px] shadow-xs"
                  style={{ backgroundColor: '#548777' }}
                >
                  <Building className="w-3.5 h-3.5 text-white" />
                  <span>{t('orgUnitsCount', { count: stats?.totalUnions || 0 })}</span>
                </div>
                <span className="inline-flex items-center text-xs font-semibold text-zinc-500 group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors">
                  {t('viewUnits')} <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>

          {/* Card 2: Total Kilais */}
          <Link href="/kilais" className="block h-full group/card cursor-pointer">
            <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden hover:-translate-y-1 p-5">
              {/* Ambient Accent Glow & Top Line */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 opacity-30 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] via-[#D97706] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center border transition-transform group-hover:scale-105 duration-300 bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40">
                    <Store className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {t('grassrootsNetwork')}
                  </span>
                </div>

                {/* Metric & Label */}
                <h3 className="font-extrabold text-[30px] sm:text-[34px] text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors my-1 tracking-tight">
                  {statsLoading ? '...' : (stats?.totalKilais || 0)}
                </h3>
                <h4 className="text-[15px] sm:text-[16px] font-bold text-zinc-800 dark:text-zinc-200">
                  {t('totalKilais')}
                </h4>
                <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
                  {t('registeredKilais')} {t('inVillagesWards')}
                </p>
              </div>

              {/* Bottom Quick Stats Pill Bar */}
              <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white font-bold text-[11px] shadow-xs"
                  style={{ backgroundColor: '#548777' }}
                >
                  <Layers className="w-3.5 h-3.5 text-white" />
                  <span>{t('kilaisCount', { count: stats?.totalKilais || 0 })}</span>
                </div>
                <span className="inline-flex items-center text-xs font-semibold text-zinc-500 group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors">
                  {t('exploreKilais')} <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>

          {/* Card 3: Total Cadres */}
          <Link href="/cadres" className="block h-full group/card cursor-pointer">
            <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden hover:-translate-y-1 p-5">
              {/* Ambient Accent Glow & Top Line */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 opacity-30 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] via-[#D97706] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center border transition-transform group-hover:scale-105 duration-300 bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-xs bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    {t('leadershipCadres')}
                  </span>
                </div>

                {/* Metric & Label */}
                <h3 className="font-extrabold text-[30px] sm:text-[34px] text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors my-1 tracking-tight">
                  {statsLoading ? '...' : (stats?.totalCadres || 0).toLocaleString()}
                </h3>
                <h4 className="text-[15px] sm:text-[16px] font-bold text-zinc-800 dark:text-zinc-200">
                  {t('totalCadres')}
                </h4>
                <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
                  {t('activeCadres')} {t('andOfficeBearers')}
                </p>
              </div>

              {/* Bottom Quick Stats Pill Bar */}
              <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white font-bold text-[11px] shadow-xs"
                  style={{ backgroundColor: '#548777' }}
                >
                  <Users className="w-3.5 h-3.5 text-white" />
                  <span>{t('cadresCount', { count: stats?.totalCadres || 0 })}</span>
                </div>
                <span className="inline-flex items-center text-xs font-semibold text-zinc-500 group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors">
                  {t('directory')} <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>

          {/* Card 4: Total Booths */}
          <Link href="/booths" className="block h-full group/card cursor-pointer">
            <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden hover:-translate-y-1 p-5">
              {/* Ambient Accent Glow & Top Line */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 opacity-30 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] via-[#D97706] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center border transition-transform group-hover:scale-105 duration-300 bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/40">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-xs bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200/60 dark:border-orange-900/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    {t('pollingStations')}
                  </span>
                </div>

                {/* Metric & Label */}
                <h3 className="font-extrabold text-[30px] sm:text-[34px] text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors my-1 tracking-tight">
                  {statsLoading ? '...' : (stats?.totalBooths || 0)}
                </h3>
                <h4 className="text-[15px] sm:text-[16px] font-bold text-zinc-800 dark:text-zinc-200">
                  {t('totalBooths')}
                </h4>
                <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
                  {t('electoralBoothsAllocated')}
                </p>
              </div>

              {/* Bottom Quick Stats Pill Bar */}
              <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white font-bold text-[11px] shadow-xs"
                  style={{ backgroundColor: '#548777' }}
                >
                  <MapPin className="w-3.5 h-3.5 text-white" />
                  <span>{t('boothsCount', { count: stats?.totalBooths || 0 })}</span>
                </div>
                <span className="inline-flex items-center text-xs font-semibold text-zinc-500 group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors">
                  {t('coverage')} <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* District Cadres Leadership Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <div className="w-2 h-6 bg-[#8F0A1B] rounded-sm"></div>
              {t('districtCadres')}
              <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#8F0A1B]/10 text-[#8F0A1B] border border-[#8F0A1B]/20">
                {districtCadres?.length || 0}
              </span>
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              {t('districtSubtitle')}
            </p>
          </div>

          <Link href="/cadres?level=DISTRICT">
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-semibold text-xs shadow-2xs">
              {t('viewAllCadres')}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-stretch">
          {/* Highlighted District Secretary Spotlight Card */}
          <div className="w-full lg:w-1/3 xl:w-1/4 shrink-0">
            {secretary ? (
              <div 
                onClick={() => setViewingCadre(secretary)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setViewingCadre(secretary);
                  }
                }}
                className="group relative flex flex-col items-center justify-between px-4 py-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden h-full cursor-pointer hover:-translate-y-1 select-none"
              >
                {/* Ambient Glow & Top Bar */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-[#8F0A1B]/15 via-[#FFC72C]/15 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#8F0A1B] via-[#D97706] to-[#FFC72C]" />

                <div className="w-full flex justify-between items-center mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#8F0A1B]/10 text-[#8F0A1B] border border-[#8F0A1B]/20 shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8F0A1B]" />
                    {t('roleSecretary')}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t('districtHead')}
                  </span>
                </div>

                <div className="my-3 relative group-hover:scale-105 transition-transform duration-300">
                  <UserAvatar 
                    src={secretary.photoUrl} 
                    name={secretary.name} 
                    size="2xl" 
                    ring="primary" 
                    elevation="glow" 
                    shape="square"
                  />
                </div>

                <div className="text-center w-full my-2">
                  <h3 className="font-extrabold text-[17px] sm:text-[18px] text-zinc-900 dark:text-zinc-50 leading-tight mb-1 group-hover:text-[#8F0A1B] transition-colors">
                    {locale === 'ta' ? translatePersonNameToTamil(secretary.name) : secretary.name}
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t('cuddaloreEastDistrict')}
                  </p>
                  {secretary.memberId && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      {secretary.memberId}
                    </span>
                  )}
                </div>

                {secretary.phone ? (
                  <button 
                    onClick={(e) => handleInitiateCall(secretary.phone || '', secretary.name, e)} 
                    className="w-full mt-3 inline-flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 py-2.5 px-4 rounded-xl transition-all active:scale-95 shadow-xs cursor-pointer group/call"
                  >
                    <Phone className="w-3.5 h-3.5 group-hover/call:animate-bounce" />
                    <span>{secretary.phone}</span>
                  </button>
                ) : (
                  <div className="w-full mt-3 py-2 text-center text-xs text-zinc-400 italic border border-dashed rounded-xl">
                    {t('noPhoneRecorded')}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 h-full text-center bg-white/50">
                <p className="text-zinc-500 font-medium text-sm">{t('noDistrictCadres')}</p>
              </div>
            )}
          </div>

          {/* List of Other District Cadres */}
          {otherCadres.length > 0 ? (
            <div className="flex-1 min-w-0 px-2 sm:px-6 relative flex flex-col justify-center">
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-3 md:-ml-4">
                  {otherCadres.map((cadre, index) => (
                    <CarouselItem key={index} className="pl-3 md:pl-4 basis-[100%] sm:basis-1/2 md:basis-1/3 lg:basis-1/2 xl:basis-1/3">
                      <div className="p-1 h-full">
                        <div 
                          onClick={() => setViewingCadre(cadre)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setViewingCadre(cadre);
                            }
                          }}
                          className="group relative flex flex-col items-center justify-between p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden h-full hover:-translate-y-1 cursor-pointer select-none"
                        >
                          {/* Ambient Glow & Top Bar */}
                          <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] via-[#D97706] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <div className="w-full flex justify-between items-center mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                              <UserCheck className="w-3 h-3 text-[#8F0A1B]" />
                              {locale === 'ta' && cadre.role ? translateRoleToTamil(cadre.role) : (cadre.role || t('roleCadre'))}
                            </span>
                            
                          </div>

                          <div className="my-3 group-hover:scale-105 transition-transform duration-300">
                            <UserAvatar 
                              src={cadre.photoUrl} 
                              name={cadre.name} 
                              size="xl" 
                              ring="primary" 
                              elevation="md" 
                              shape="square"
                            />
                          </div>

                          <div className="text-center w-full my-1">
                            <h4 className="font-extrabold text-[15px] sm:text-[16px] text-zinc-900 dark:text-zinc-100 line-clamp-1 leading-snug group-hover:text-[#8F0A1B] transition-colors">
                              {locale === 'ta' ? translatePersonNameToTamil(cadre.name) : cadre.name}
                            </h4>
                            {cadre.memberId && (
                              <span className="text-[10px] font-mono text-zinc-400">
                                {cadre.memberId}
                              </span>
                            )}
                          </div>

                          {cadre.phone ? (
                            <button 
                              onClick={(e) => handleInitiateCall(cadre?.phone || '', cadre.name, e)} 
                              className="w-full mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 py-2 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer group/itemcall"
                            >
                              <Phone className="w-3.5 h-3.5 group-hover/itemcall:animate-bounce" />
                              <span>{cadre.phone}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic mt-3">{t('noContactNumber')}</span>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="flex -left-3 sm:-left-5 lg:-left-6 bg-white shadow-md border-zinc-200 hover:bg-[#8F0A1B] hover:text-white transition-colors" />
                <CarouselNext className="flex -right-3 sm:-right-5 lg:-right-6 bg-white shadow-md border-zinc-200 hover:bg-[#8F0A1B] hover:text-white transition-colors" />
              </Carousel>
            </div>
          ) : (
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center bg-white/70 dark:bg-zinc-900/40 min-h-[240px] shadow-sm">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('noOtherDistrictCadres')}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {t('additionalDistrictCadresDesc')}
              </p>
              <Link href="/cadres" className="mt-4">
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold border-primary/20 text-primary hover:bg-primary/5">
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  {t('manageDistrictCadres')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Modules Hub - Styled in Org Units Cards Style */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <div className="w-2 h-6 bg-[#8F0A1B] rounded-sm"></div>
              {t('quickAccess', { fallback: 'Quick Access Hub' })}
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              {t('quickAccessDesc', { fallback: 'Instant navigation across critical administration modules' })}
            </p>
          </div>
        </div>

        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Module 1: Wings */}
          <Link href="/wings" className="block h-full group/card cursor-pointer">
            <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden hover:-translate-y-1 p-5">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center border bg-purple-50 text-purple-600 border-purple-100 group-hover:scale-105 transition-transform">
                    <Network className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 border border-purple-200/60">
                    {t('frontsWings')}
                  </span>
                </div>
                <h3 className="font-extrabold text-[16px] text-zinc-900 dark:text-zinc-100 group-hover:text-[#8F0A1B] transition-colors mb-1">
                  {t('specialisedWings')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {t('wingsDesc')}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-500 group-hover:text-[#8F0A1B] transition-colors">
                <span>{t('manageWings')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Module 2: Polling Booths */}
          <Link href="/booths" className="block h-full group/card cursor-pointer">
            <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden hover:-translate-y-1 p-5">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center border bg-orange-50 text-orange-600 border-orange-100 group-hover:scale-105 transition-transform">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-700 border border-orange-200/60">
                    {t('electoral')}
                  </span>
                </div>
                <h3 className="font-extrabold text-[16px] text-zinc-900 dark:text-zinc-100 group-hover:text-[#8F0A1B] transition-colors mb-1">
                  {t('pollingBooths')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {t('boothsDesc')}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-500 group-hover:text-[#8F0A1B] transition-colors">
                <span>{t('boothMapping')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Module 3: Announcements */}
          <Link href="/announcements" className="block h-full group/card cursor-pointer">
            <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden hover:-translate-y-1 p-5">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center border bg-amber-50 text-amber-600 border-amber-100 group-hover:scale-105 transition-transform">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-200/60">
                    {t('official')}
                  </span>
                </div>
                <h3 className="font-extrabold text-[16px] text-zinc-900 dark:text-zinc-100 group-hover:text-[#8F0A1B] transition-colors mb-1">
                  {t('announcements')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {t('announcementsDesc')}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-500 group-hover:text-[#8F0A1B] transition-colors">
                <span>{t('viewBulletins')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Module 4: Analytics */}
          <Link href="/analytics" className="block h-full group/card cursor-pointer">
            <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden hover:-translate-y-1 p-5">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8F0A1B] to-[#FFC72C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl shadow-xs shrink-0 flex items-center justify-center border bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:scale-105 transition-transform">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-200/60">
                    {t('insights')}
                  </span>
                </div>
                <h3 className="font-extrabold text-[16px] text-zinc-900 dark:text-zinc-100 group-hover:text-[#8F0A1B] transition-colors mb-1">
                  {t('analyticsReports')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {t('analyticsDesc')}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-500 group-hover:text-[#8F0A1B] transition-colors">
                <span>{t('viewAnalytics')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Shared Call Confirmation Dialog */}
      <CallConfirmationDialog 
        person={callPerson} 
        onOpenChange={(open) => !open && setCallPerson(null)} 
      />

      {/* Administrator Details View Dialog */}
      <CadreViewDialog
        isOpen={!!viewingCadre}
        onOpenChange={(open) => !open && setViewingCadre(null)}
        cadre={viewingCadre}
      />
    </div>
  );
}
