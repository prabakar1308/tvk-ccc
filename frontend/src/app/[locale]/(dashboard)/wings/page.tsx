'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSessionStorage } from '@/hooks/use-session-storage';
import {
  Monitor, Scale, Radio, Mic, GraduationCap, Users, TreePine, 
  History, Rainbow, HeartHandshake, Zap, BookOpen, UserRound, 
  UserPlus, Baby, Shield, Store, Sailboat, Scissors, Briefcase, 
  HardHat, Lightbulb, Globe, Stethoscope, Wheat, Palette, 
  HandHeart, Tv
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit2, Users as UsersIcon, Building2, MapPin, Phone, ShieldCheck, Clock, ChevronRight } from 'lucide-react';
import { useDistricts } from '@/hooks/use-districts';
import { useUnions } from '@/hooks/use-unions';
import { useRouter } from '@/i18n/routing';


import { useWings } from '@/hooks/use-wings';
import { UserAvatar } from '@/components/ui/user-avatar';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';

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

export default function WingsPage() {
  const locale = useLocale();
  const t = useTranslations('Wings');
  const tCommon = useTranslations('Common');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'order' | 'name'>('priority');
  const [activeLevel, setActiveLevel, isMounted1] = useSessionStorage('wings_level', 'district');
  const [selectedDistrictId, setSelectedDistrictId, isMounted2] = useSessionStorage<string>('wings_district', '');
  const [selectedUnionId, setSelectedUnionId, isMounted3] = useSessionStorage<string>('wings_union', '');
  
  const isMounted = isMounted1 && isMounted2 && isMounted3;

  const router = useRouter();
  const [callPerson, setCallPerson] = useState<{ name: string; phone: string } | null>(null);

  const handleInitiateCall = (phone: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCallPerson({ phone, name });
  };

  const { data: districts = [] } = useDistricts();
  const { data: unions = [] } = useUnions();
  
  const orgId = activeLevel === 'district' ? selectedDistrictId : selectedUnionId;
  const { data: wingsData = [], isLoading: isWingsLoading } = useWings(activeLevel, orgId);

  useEffect(() => {
    if (activeLevel === 'district' && districts.length > 0 && !selectedDistrictId) {
      setSelectedDistrictId(districts[0].id);
    }
  }, [activeLevel, districts, selectedDistrictId]);

  useEffect(() => {
    if (activeLevel === 'union' && unions.length > 0 && !selectedUnionId) {
      setSelectedUnionId(unions[0].id);
    }
  }, [activeLevel, unions, selectedUnionId]);

  const filteredWings = wingsData.filter((wing: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesWingName = wing.name.toLowerCase().includes(searchLower);
    const matchesCadreName = wing.cadres?.some((cadre: any) => 
      cadre.name?.toLowerCase().includes(searchLower)
    );
    return matchesWingName || matchesCadreName;
  });

  const sortedWings = [...filteredWings].sort((a: any, b: any) => {
    if (sortBy === 'priority') {
      return (b.priority || 0) - (a.priority || 0) || (a.order || 0) - (b.order || 0);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      return (a.order || 0) - (b.order || 0);
    }
  });

  const handleManageWing = (wing: any) => {
    router.push(`/wings/${wing.id}`);
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold uppercase tracking-wide text-primary">
            {t('title', { fallback: 'Wings Management' })}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base font-medium">
            {t('description', { fallback: 'Manage different wings for district and org unit levels.' })}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-primary/10">
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full w-full sm:w-[320px] shadow-inner shrink-0">
          <button 
            className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${activeLevel === 'district' ? 'bg-white dark:bg-zinc-900 shadow-md text-[#8F0A1B] dark:text-red-400' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}`}
            onClick={() => setActiveLevel('district')}
          >
            District Level
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${activeLevel === 'union' ? 'bg-white dark:bg-zinc-900 shadow-md text-[#8F0A1B] dark:text-red-400' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}`}
            onClick={() => setActiveLevel('union')}
          >
            Org Unit Level
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center w-full lg:w-auto gap-3 flex-1 justify-end">
          <div className="w-full sm:w-[220px]">
            {activeLevel === 'district' ? (
              <Select value={selectedDistrictId} onValueChange={(val) => val && setSelectedDistrictId(val)}>
                <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-900 border-primary/20 rounded-md h-11">
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  <span className="flex-1 text-left truncate">{districts.find((d: any) => d.id === selectedDistrictId)?.name || "Select District"}</span>
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={selectedUnionId} onValueChange={(val) => val && setSelectedUnionId(val)}>
                <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-900 border-primary/20 rounded-md h-11">
                  <Building2 className="w-4 h-4 mr-2 text-primary" />
                  <span className="flex-1 text-left truncate">{unions.find((u: any) => u.id === selectedUnionId)?.name || "Select Org Unit"}</span>
                </SelectTrigger>
                <SelectContent>
                  {unions.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="w-full sm:w-[170px]">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-900 border-primary/20 rounded-md h-11">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority (High-Low)</SelectItem>
                <SelectItem value="order">Default (Order)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full sm:w-[260px] md:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder={tCommon('search', { fallback: 'Search wings...' })}
              className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus:bg-background rounded-md h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid view of wings */}
      {isWingsLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedWings.map((wing: any) => {
            const Icon = iconMap[wing.iconName] || Shield;
            const theme = getThemeStyles(wing.color);
            const coordinator = wing.cadres?.find((c: any) => c.role === 'COORDINATOR');
            const coCount = wing._count?.cadres || 0;
            const fillPercent = Math.min(100, Math.round((coCount / 10) * 100));
            
            return (
              <div 
                key={wing.id} 
                className="group relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs hover:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.12)] hover:border-[#8F0A1B]/40 dark:hover:border-[#8F0A1B]/50 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
                onClick={() => handleManageWing(wing)}
              >
                {/* Top Colored Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.solid} opacity-90 group-hover:opacity-100 transition-opacity z-10`} />
                
                {/* Ambient Decorative Gradient */}
                <div className={`absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-gradient-to-br ${theme.gradient} rounded-full opacity-60 group-hover:scale-150 transition-transform duration-700 ease-out pointer-events-none z-0`} />

                <div className="p-5 pb-3 flex-1 flex flex-col z-10 relative">
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className={`p-2.5 rounded-2xl bg-white dark:bg-zinc-800 border ${theme.border} group-hover:scale-110 transition-transform duration-300 shadow-sm flex items-center justify-center shrink-0`}>
                      <Icon className={`w-6 h-6 ${theme.icon}`} />
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs"
                        style={{ backgroundColor: '#6d9188ff', color: 'white' }}
                      >
                        Wing {wing.order < 10 ? `0${wing.order}` : wing.order}
                      </span>
                      {coordinator ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
                          <Clock className="w-2.5 h-2.5" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Wing Name & Tamil Subtitle */}
                  <div className="mb-4">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-[17px] leading-snug group-hover:text-[#8F0A1B] transition-colors line-clamp-2">
                      {wing.name}
                    </h3>
                    {wing.translations?.ta?.name && (
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                        {wing.translations.ta.name}
                      </p>
                    )}
                  </div>

                  {/* Executive Leadership / Coordinator Section */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Leadership
                      </span>
                    </div>
                    {coordinator ? (
                      <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-zinc-50/90 to-white dark:from-zinc-900/90 dark:to-zinc-950/80 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 group-hover:border-[#8F0A1B]/25 transition-colors shadow-xs">
                        <div className="flex flex-col flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-[#8F0A1B]/10 text-[#8F0A1B] dark:bg-[#8F0A1B]/25 dark:text-red-300">
                              <ShieldCheck className="w-3 h-3 text-[#8F0A1B] dark:text-red-400" />
                              Coordinator
                            </span>
                          </div>
                          <h4 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 truncate leading-snug group-hover:text-[#8F0A1B] transition-colors">
                            {coordinator.name}
                          </h4>
                          {coordinator.phone ? (
                            <button 
                              onClick={(e) => handleInitiateCall(coordinator.phone, coordinator.name, e)} 
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-lg transition-all active:scale-95 shadow-xs w-max mt-1 group/phone"
                            >
                              <Phone className="w-3 h-3 group-hover/phone:animate-bounce" />
                              <span>{coordinator.phone}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic mt-0.5">No phone provided</span>
                          )}
                        </div>
                        <div className="relative group-hover:scale-105 transition-transform duration-300 shrink-0">
                          <UserAvatar 
                            src={coordinator.photoUrl} 
                            name={coordinator.name} 
                            size="xl" 
                            shape="square" 
                            ring="primary" 
                            elevation="md" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                            <Clock className="w-3 h-3" />
                            Vacancy
                          </span>
                          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Coordinator</span>
                          <span className="text-[11px] text-zinc-400 italic">Not Assigned</span>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                          <UserPlus className="w-6 h-6" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Section */}
                <div className="p-4 pt-0 z-10 relative">
                  {/* Co-coordinators Capacity Bar */}
                  <div 
                    className="text-xs text-zinc-800"
                    style={{
                      background: '#e9edec',
                      borderRadius: '15px',
                      padding: '7px 10px',
                      fontWeight: 'bold',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-800">
                        <UsersIcon className="w-3.5 h-3.5 text-[#548777]" />
                        <span>Co-coordinators</span>
                      </div>
                      <span className="text-xs font-black text-zinc-900">
                        {coCount} <span className="text-zinc-500 font-medium">/ 10</span>
                      </span>
                    </div>
                    
                    <div className="w-full bg-white/90 dark:bg-zinc-700/60 rounded-full h-1.5 overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${fillPercent}%`,
                          backgroundColor: coCount > 0 ? '#548777' : '#cbd5e1' 
                        }}
                      />
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 group-hover:text-[#8F0A1B] transition-colors mt-2.5 px-1 font-semibold">
                    <span className="text-[11px]">Manage Cadres</span>
                    <div className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      <span className="text-[11px] font-bold">Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredWings.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No wings found</h3>
          <p className="text-gray-500">Try adjusting your search query.</p>
        </div>
      )}

      <CallConfirmationDialog 
        person={callPerson} 
        onOpenChange={(open) => !open && setCallPerson(null)} 
      />
    </div>
  );
}
