'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Monitor, Scale, Radio, Mic, GraduationCap, Users, TreePine, 
  History, Rainbow, HeartHandshake, Zap, BookOpen, UserRound, 
  UserPlus, Baby, Shield, Store, Sailboat, Scissors, Briefcase, 
  HardHat, Lightbulb, Globe, Stethoscope, Wheat, Palette, 
  HandHeart, Tv, Phone, ShieldCheck, ArrowRight, 
  LayoutGrid, SlidersHorizontal
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useWings } from '@/hooks/use-wings';
import { useDistricts } from '@/hooks/use-districts';
import { translatePersonNameToTamil, isCoordinatorRole } from '@/lib/name-translations';

const iconMap: Record<string, any> = {
  Monitor, Scale, Radio, Mic, GraduationCap, Users, TreePine, 
  History, Rainbow, HeartHandshake, Zap, BookOpen, UserRound, 
  UserPlus, Baby, Shield, Store, Sailboat, Scissors, Briefcase, 
  HardHat, Lightbulb, Globe, Stethoscope, Wheat, Palette, 
  HandHeart, Tv
};

const getThemeStyles = (colorStr?: string) => {
  const baseColor = colorStr?.match(/bg-([a-z]+)-/)?.[1] || 'gray';
  
  const themes: Record<string, {
    solid: string;
    bg: string;
    text: string;
    border: string;
    gradient: string;
    icon: string;
  }> = {
    red: { solid: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800/60', gradient: 'from-red-500/20 to-transparent', icon: 'text-red-500 dark:text-red-400' },
    blue: { solid: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/60', gradient: 'from-blue-500/20 to-transparent', icon: 'text-blue-500 dark:text-blue-400' },
    green: { solid: 'bg-green-600', bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800/60', gradient: 'from-green-600/20 to-transparent', icon: 'text-green-600 dark:text-green-400' },
    yellow: { solid: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/60', gradient: 'from-amber-500/20 to-transparent', icon: 'text-amber-600 dark:text-amber-400' },
    purple: { solid: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/60', gradient: 'from-purple-500/20 to-transparent', icon: 'text-purple-500 dark:text-purple-400' },
    pink: { solid: 'bg-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/40', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800/60', gradient: 'from-pink-500/20 to-transparent', icon: 'text-pink-500 dark:text-pink-400' },
    indigo: { solid: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/60', gradient: 'from-indigo-500/20 to-transparent', icon: 'text-indigo-500 dark:text-indigo-400' },
    orange: { solid: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/60', gradient: 'from-orange-500/20 to-transparent', icon: 'text-orange-500 dark:text-orange-400' },
    teal: { solid: 'bg-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800/60', gradient: 'from-teal-500/20 to-transparent', icon: 'text-teal-500 dark:text-teal-400' },
    cyan: { solid: 'bg-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800/60', gradient: 'from-cyan-500/20 to-transparent', icon: 'text-cyan-500 dark:text-cyan-400' },
    emerald: { solid: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/60', gradient: 'from-emerald-500/20 to-transparent', icon: 'text-emerald-500 dark:text-emerald-400' },
    rose: { solid: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/60', gradient: 'from-rose-500/20 to-transparent', icon: 'text-rose-500 dark:text-rose-400' },
    amber: { solid: 'bg-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/60', gradient: 'from-amber-600/20 to-transparent', icon: 'text-amber-600 dark:text-amber-400' },
    slate: { solid: 'bg-slate-700', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300 dark:border-slate-700', gradient: 'from-slate-700/20 to-transparent', icon: 'text-slate-700 dark:text-slate-300' },
    sky: { solid: 'bg-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800/60', gradient: 'from-sky-500/20 to-transparent', icon: 'text-sky-500 dark:text-sky-400' },
    fuchsia: { solid: 'bg-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-200 dark:border-fuchsia-800/60', gradient: 'from-fuchsia-500/20 to-transparent', icon: 'text-fuchsia-500 dark:text-fuchsia-400' },
    violet: { solid: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800/60', gradient: 'from-violet-500/20 to-transparent', icon: 'text-violet-500 dark:text-violet-400' },
    lime: { solid: 'bg-lime-500', bg: 'bg-lime-50 dark:bg-lime-950/40', text: 'text-lime-700 dark:text-lime-400', border: 'border-lime-200 dark:border-lime-800/60', gradient: 'from-lime-500/20 to-transparent', icon: 'text-lime-600 dark:text-lime-400' },
    stone: { solid: 'bg-stone-500', bg: 'bg-stone-100 dark:bg-stone-800', text: 'text-stone-700 dark:text-stone-300', border: 'border-stone-300 dark:border-stone-700', gradient: 'from-stone-500/20 to-transparent', icon: 'text-stone-600 dark:text-stone-400' },
    gray: { solid: 'bg-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700', gradient: 'from-gray-500/20 to-transparent', icon: 'text-gray-500 dark:text-gray-400' },
  };

  return themes[baseColor] || themes.gray;
};

interface WingsCoordinatorsSectionProps {
  onInitiateCall: (phone: string, name: string, e: React.MouseEvent) => void;
  onViewCadre: (cadre: any) => void;
}

export function WingsCoordinatorsSection({
  onInitiateCall,
  onViewCadre,
}: WingsCoordinatorsSectionProps) {
  const t = useTranslations('Dashboard');
  const locale = useLocale();

  const { data: districts = [] } = useDistricts();
  const districtId = districts[0]?.id;
  const { data: wingsData = [], isLoading } = useWings('district', districtId);

  const [filter, setFilter] = useState<'all' | 'assigned' | 'vacant'>('all');
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [api, setApi] = useState<CarouselApi>();
  const isDraggingRef = useRef(false);

  // Track dragging to prevent cards/links from inadvertently opening when sliding carousel
  useEffect(() => {
    if (!api) return;

    let hasScrolled = false;

    const onPointerDown = () => {
      hasScrolled = false;
    };

    const onScroll = () => {
      hasScrolled = true;
    };

    const onPointerUp = () => {
      if (hasScrolled) {
        isDraggingRef.current = true;
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 120);
      } else {
        isDraggingRef.current = false;
      }
    };

    api.on('pointerDown', onPointerDown);
    api.on('scroll', onScroll);
    api.on('pointerUp', onPointerUp);

    return () => {
      api.off('pointerDown', onPointerDown);
      api.off('scroll', onScroll);
      api.off('pointerUp', onPointerUp);
    };
  }, [api]);

  const isClickAllowed = () => !isDraggingRef.current;

  // Reset to slide 0 whenever filter changes
  useEffect(() => {
    if (api) {
      api.scrollTo(0);
    }
  }, [filter, api]);

  // Sort strictly by wing's official order ascending (1, 2, 3...)
  const sortedWings = [...wingsData].sort((a: any, b: any) => {
    return (a.order || 0) - (b.order || 0);
  });

  const wingsWithCoordinators = sortedWings.map((wing: any) => {
    const coordinator = wing.cadres?.find(
      (c: any) => isCoordinatorRole(c.rawRole || c.canonicalRole || c.role)
    );
    return {
      ...wing,
      coordinator,
    };
  });

  const assignedCount = wingsWithCoordinators.filter(w => !!w.coordinator).length;
  const vacantCount = wingsWithCoordinators.filter(w => !w.coordinator).length;

  const displayWings = wingsWithCoordinators.filter((wing) => {
    if (filter === 'assigned') return !!wing.coordinator;
    if (filter === 'vacant') return !wing.coordinator;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse border border-zinc-200/60 dark:border-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <div className="w-2 h-6 bg-[#8F0A1B] rounded-sm shrink-0" />
            <span>{t('wingsCoordinators', { fallback: 'Wings Coordinators' })}</span>
            <span className="ml-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#8F0A1B]/10 text-[#8F0A1B] border border-[#8F0A1B]/20">
              {wingsData.length || 0}
            </span>
            {/* {assignedCount > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {assignedCount} {t('assignedCoordinators', { fallback: 'Assigned' })}
              </span>
            )} */}
          </h2>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">
            {t('wingsCoordinatorsSubtitle', {
              fallback: 'District executive coordinators across party wings in official sequence',
            })}
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Filter Pills */}
          {/* <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs text-xs font-bold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-[#8F0A1B] dark:text-red-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              {t('allWings', { fallback: 'All Wings' })} ({sortedWings.length})
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filter === 'assigned'
                  ? 'bg-white dark:bg-zinc-900 text-[#8F0A1B] dark:text-red-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t('assignedCoordinators', { fallback: 'Assigned' })} ({assignedCount})
            </button>
            <button
              onClick={() => setFilter('vacant')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'vacant'
                  ? 'bg-white dark:bg-zinc-900 text-[#8F0A1B] dark:text-red-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              {t('vacantPositions', { fallback: 'Vacancies' })} ({vacantCount})
            </button>
          </div> */}

          {/* View Mode Toggle: Carousel vs Grid */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs">
            <button
              onClick={() => setViewMode('carousel')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'carousel'
                  ? 'bg-white dark:bg-zinc-900 text-[#8F0A1B] dark:text-red-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
              title="Carousel slider"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-[#8F0A1B] dark:text-red-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* View All Wings Link */}
          <Link href="/wings">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-semibold text-xs shadow-2xs shrink-0"
            >
              {t('viewAllWings', { fallback: 'View All Wings' })}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards Content */}
      {displayWings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center bg-white/70 dark:bg-zinc-900/40 min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {t('noWingsFound', { fallback: 'No wings found for this filter.' })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter('all')}
            className="mt-3 rounded-xl text-xs font-semibold"
          >
            {t('allWings', { fallback: 'Show All Wings' })}
          </Button>
        </div>
      ) : viewMode === 'carousel' ? (
        /* Carousel View */
        <div className="relative px-2 sm:px-6">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: false,
              dragFree: true,
              containScroll: 'trimSnaps',
              duration: 35,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3 md:-ml-4 cursor-grab active:cursor-grabbing select-none py-1">
              {displayWings.map((wing: any) => (
                <CarouselItem
                  key={wing.id}
                  className="pl-3 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/4 select-none"
                >
                  <div className="p-1 h-full select-none">
                    <WingCoordinatorCard
                      wing={wing}
                      locale={locale}
                      t={t}
                      onInitiateCall={onInitiateCall}
                      onViewCadre={onViewCadre}
                      isClickAllowed={isClickAllowed}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="flex -left-2 sm:-left-4 lg:-left-5 w-10 h-10 rounded-full z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs shadow-lg border-zinc-200/90 dark:border-zinc-800 hover:bg-[#8F0A1B] hover:text-white dark:hover:bg-[#8F0A1B] dark:hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer" />
            <CarouselNext className="flex -right-2 sm:-right-4 lg:-right-5 w-10 h-10 rounded-full z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs shadow-lg border-zinc-200/90 dark:border-zinc-800 hover:bg-[#8F0A1B] hover:text-white dark:hover:bg-[#8F0A1B] dark:hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer" />
          </Carousel>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayWings.map((wing: any) => (
            <WingCoordinatorCard
              key={wing.id}
              wing={wing}
              locale={locale}
              t={t}
              onInitiateCall={onInitiateCall}
              onViewCadre={onViewCadre}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface WingCoordinatorCardProps {
  wing: any;
  locale: string;
  t: any;
  onInitiateCall: (phone: string, name: string, e: React.MouseEvent) => void;
  onViewCadre: (cadre: any) => void;
  isClickAllowed?: () => boolean;
}

function WingCoordinatorCard({
  wing,
  locale,
  t,
  onInitiateCall,
  onViewCadre,
  isClickAllowed,
}: WingCoordinatorCardProps) {
  const Icon = iconMap[wing.iconName] || Shield;
  const theme = getThemeStyles(wing.color);
  const coordinator = wing.coordinator;

  const displayName =
    locale === 'ta' && wing.translations?.ta?.name
      ? wing.translations.ta.name
      : wing.name;

  const subtitleName =
    locale === 'ta'
      ? wing.name
      : wing.translations?.ta?.name;

  const handleCoordinatorClick = () => {
    if (isClickAllowed && !isClickAllowed()) return;
    if (coordinator) {
      onViewCadre(coordinator);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (isClickAllowed && !isClickAllowed()) {
      e.preventDefault();
    }
  };

  return (
    <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/60 bg-gradient-to-b from-white via-white to-zinc-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 shadow-md hover:shadow-2xl hover:shadow-[#8F0A1B]/15 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-[border-color,box-shadow,transform] duration-200 transform-gpu overflow-hidden hover:-translate-y-1 select-none">
      {/* Top Accent Strip */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${theme.solid} opacity-90 group-hover:opacity-100 transition-opacity z-10`} />

      {/* Ambient Gradient Glow */}
      <div className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${theme.gradient} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none z-0`} />

      <div className="p-4 sm:p-5 flex-1 flex flex-col relative z-10">
        {/* Wing Identity: Icon & Name */}
        <Link 
          href={`/wings/${wing.id}`}
          onClick={handleLinkClick}
          className="flex items-center gap-3 group/wing mb-4"
        >
          <div className={`w-10 h-10 rounded-xl p-2 bg-white dark:bg-zinc-800 border ${theme.border} group-hover:scale-105 transition-transform shadow-xs flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${theme.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-[15px] sm:text-[16px] text-zinc-900 dark:text-zinc-100 group-hover:text-[#8F0A1B] dark:group-hover:text-red-400 transition-colors line-clamp-1 leading-snug">
              {displayName}
            </h3>
            {subtitleName && (
              <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
                {subtitleName}
              </p>
            )}
          </div>
        </Link>

        {/* Coordinator Body Section */}
        <div className="mt-auto pt-2">
          {coordinator ? (
            <div
              onClick={handleCoordinatorClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewCadre(coordinator);
                }
              }}
              className="group/coord relative flex flex-col items-center p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-[#8F0A1B]/30 dark:hover:border-[#8F0A1B]/40 transition-all cursor-pointer shadow-2xs hover:shadow-md"
            >
              {/* Coordinator Role Pill */}
              <div className="w-full flex justify-center items-center mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#8F0A1B]/10 text-[#8F0A1B] dark:bg-[#8F0A1B]/20 dark:text-red-300">
                  <ShieldCheck className="w-3 h-3 text-[#8F0A1B]" />
                  {t('wingCoordinator', { fallback: 'Coordinator' })}
                </span>
              </div>

              {/* Avatar */}
              <div className="my-2 group-hover/coord:scale-105 transition-transform duration-300">
                <UserAvatar
                  src={coordinator.photoUrl}
                  name={coordinator.name}
                  size="2xl"
                  ring="primary"
                  elevation="md"
                  shape="square"
                />
              </div>

              {/* Name & District */}
              <div className="text-center w-full my-1">
                <h4 className="font-extrabold text-[14px] sm:text-[15px] text-zinc-900 dark:text-zinc-100 truncate group-hover/coord:text-[#8F0A1B] transition-colors leading-tight">
                  {locale === 'ta'
                    ? translatePersonNameToTamil(coordinator.name)
                    : coordinator.name}
                </h4>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                  {coordinator.district?.name || t('cuddaloreEastDistrict', { fallback: 'District Head' })}
                </p>
                
                {coordinator.memberId && (
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    {coordinator.memberId}
                  </span>
                )}
              </div>

              {/* Phone / Call Button */}
              {coordinator.phone ? (
                <button
                  onClick={(e) => {
                    if (isClickAllowed && !isClickAllowed()) {
                      e.preventDefault();
                      return;
                    }
                    onInitiateCall(coordinator.phone, coordinator.name, e);
                  }}
                  className="w-full mt-2.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 py-2 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer group/call"
                >
                  <Phone className="w-3.5 h-3.5 group-hover/call:animate-bounce" />
                  <span className="font-mono">{coordinator.phone}</span>
                </button>
              ) : (
                <span className="text-[11px] text-zinc-400 italic mt-2.5 text-center">
                  {t('noContactNumber', { fallback: 'No contact number' })}
                </span>
              )}
            </div>
          ) : (
            /* Vacancy State */
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 text-center min-h-[220px]">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 shadow-2xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {t('coordinatorNotAssigned', { fallback: 'Coordinator Not Appointed' })}
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t('frontsWings', { fallback: 'Specialised Wing' })}
              </p>
              <Link
                href={`/wings/${wing.id}`}
                onClick={handleLinkClick}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#8F0A1B] dark:text-red-400 hover:underline"
              >
                <span>{t('appointCoordinator', { fallback: 'Appoint Position' })}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
