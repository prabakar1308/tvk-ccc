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

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit2, Users as UsersIcon, Building2, MapPin, Phone } from 'lucide-react';
import { useDistricts } from '@/hooks/use-districts';
import { useUnions } from '@/hooks/use-unions';
import { useRouter } from '@/i18n/routing';


import { useWings } from '@/hooks/use-wings';

const iconMap: Record<string, any> = {
  Monitor, Scale, Radio, Mic, GraduationCap, Users, TreePine, 
  History, Rainbow, HeartHandshake, Zap, BookOpen, UserRound, 
  UserPlus, Baby, Shield, Store, Sailboat, Scissors, Briefcase, 
  HardHat, Lightbulb, Globe, Stethoscope, Wheat, Palette, 
  HandHeart, Tv
};

const getThemeStyles = (colorStr?: string) => {
  const baseColor = colorStr?.match(/bg-([a-z]+)-/)?.[1] || 'gray';
  
  const themes: Record<string, any> = {
    red: { solid: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', gradient: 'from-red-50 to-white', icon: 'text-red-500' },
    blue: { solid: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-50 to-white', icon: 'text-blue-500' },
    green: { solid: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', gradient: 'from-green-50 to-white', icon: 'text-green-500' },
    yellow: { solid: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', gradient: 'from-yellow-50 to-white', icon: 'text-yellow-500' },
    purple: { solid: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-50 to-white', icon: 'text-purple-500' },
    pink: { solid: 'bg-pink-500', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', gradient: 'from-pink-50 to-white', icon: 'text-pink-500' },
    indigo: { solid: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', gradient: 'from-indigo-50 to-white', icon: 'text-indigo-500' },
    orange: { solid: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', gradient: 'from-orange-50 to-white', icon: 'text-orange-500' },
    teal: { solid: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', gradient: 'from-teal-50 to-white', icon: 'text-teal-500' },
    cyan: { solid: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', gradient: 'from-cyan-50 to-white', icon: 'text-cyan-500' },
    emerald: { solid: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-50 to-white', icon: 'text-emerald-500' },
    rose: { solid: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-50 to-white', icon: 'text-rose-500' },
    amber: { solid: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-50 to-white', icon: 'text-amber-500' },
    gray: { solid: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', gradient: 'from-gray-50 to-white', icon: 'text-gray-500' },
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

  const filteredWings = wingsData.filter((wing: any) => 
    wing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('title', { fallback: 'Wings Management' })}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('description', { fallback: 'Manage different wings for district and org unit levels.' })}
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="w-full sm:w-[180px]">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-full bg-white border-gray-200 rounded-xl focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority (High-Low)</SelectItem>
                <SelectItem value="order">Default (Order)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder={tCommon('search', { fallback: 'Search wings...' })}
              className="pl-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex bg-gray-100 p-1.5 rounded-full w-full sm:w-[320px] shadow-inner">
          <button 
            className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${activeLevel === 'district' ? 'bg-white shadow-md text-[#8F0A1B]' : 'text-gray-500 hover:text-gray-800'}`}
            onClick={() => setActiveLevel('district')}
          >
            District Level
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${activeLevel === 'union' ? 'bg-white shadow-md text-[#8F0A1B]' : 'text-gray-500 hover:text-gray-800'}`}
            onClick={() => setActiveLevel('union')}
          >
            Org Unit Level
          </button>
        </div>

        <div className="w-full sm:w-[300px]">
          {activeLevel === 'district' ? (
            <Select value={selectedDistrictId} onValueChange={(val) => val && setSelectedDistrictId(val)}>
              <SelectTrigger className="w-full bg-white border-gray-200 rounded-xl">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
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
              <SelectTrigger className="w-full bg-white border-gray-200 rounded-xl">
                <Building2 className="w-4 h-4 mr-2 text-gray-500" />
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
      </div>

      {/* Grid view of wings */}
      {isWingsLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedWings.map((wing: any) => {
            const Icon = iconMap[wing.iconName] || Shield;
            const theme = getThemeStyles(wing.color);
            return (
            <Card 
              key={wing.id} 
              className="group relative overflow-hidden border border-gray-200 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-primary/40 hover:ring-2 hover:ring-primary/10 transition-all duration-300 rounded-3xl bg-white hover:-translate-y-1 cursor-pointer"
              onClick={() => handleManageWing(wing)}
            >
              <CardContent className="p-0 h-full flex flex-col">
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.solid} opacity-80 group-hover:opacity-100 transition-opacity`} />
                
                {/* Background Pattern */}
                <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br ${theme.gradient} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out z-0`} />
                
                <div className="p-6 flex-1 flex flex-col z-10 relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`p-3.5 rounded-xl bg-gradient-to-br ${theme.gradient} border ${theme.border} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <Icon className={`w-6 h-6 ${theme.icon}`} />
                    </div>
                    <span className={`${theme.bg} ${theme.text} border ${theme.border} font-bold text-[10px] uppercase tracking-wider rounded-full px-3 py-1 shadow-sm`}>
                      Wing {wing.order}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-[17px] mb-2 leading-snug line-clamp-2 min-h-[48px]">
                    {wing.name}
                  </h3>
                  
                  <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Coordinator</span>
                        {wing.cadres && wing.cadres.length > 0 ? (
                          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold border border-green-100">Active</span>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold border border-gray-200">Pending</span>
                        )}
                      </div>
                      
                      {wing.cadres && wing.cadres.length > 0 ? (
                        <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-xl border border-gray-100/50 group-hover:bg-white group-hover:border-gray-200 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm shrink-0 overflow-hidden">
                            {wing.cadres[0].photoUrl ? (
                              <img src={wing.cadres[0].photoUrl} alt={wing.cadres[0].name} className="w-full h-full object-cover" />
                            ) : (
                              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(wing.cadres[0].name)}&background=8F0A1B&color=fff`} alt={wing.cadres[0].name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[13px] font-bold text-gray-900 truncate">{wing.cadres[0].name}</span>
                            {wing.cadres[0].phone && (
                              <a href={`tel:${wing.cadres[0].phone}`} className="text-[11px] font-medium text-gray-500 hover:text-[#8F0A1B] flex items-center gap-1 mt-0.5 transition-colors" onClick={(e) => e.stopPropagation()}>
                                <Phone className="w-3 h-3" /> {wing.cadres[0].phone}
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-red-50/30 p-2 rounded-xl border border-red-100/50">
                          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                            <UserPlus className="w-4 h-4 text-red-300" />
                          </div>
                          <span className="text-[13px] font-medium text-red-400 italic">Not Assigned</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <UsersIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Co-coordinators</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                          {wing._count?.cadres || 0} / 10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
}
