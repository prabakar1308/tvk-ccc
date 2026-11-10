'use client';

import React from 'react';
import { Store, Building2, Users, MapPin } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface PanchayatStatsProps {
  kilaisCount: number;
  boothsCount: number;
  cadresCount: number;
  villagesCount?: number;
  geoData?: {
    center: [number, number];
    boundaryCoords: [number, number][];
    isSurveyed: boolean;
  };
  unionId?: string;
  panchayatId?: string;
  locale: string;
}

export function PanchayatStats({
  kilaisCount,
  boothsCount,
  cadresCount,
  villagesCount = 0,
  geoData,
  unionId,
  panchayatId,
  locale,
}: PanchayatStatsProps) {
  const kilaisTargetUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    if (unionId) params.append('union', unionId);
    if (panchayatId) params.append('panchayat', panchayatId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return `/kilais${qs}`;
  }, [unionId, panchayatId]);

  const boothsTargetUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    if (unionId) params.append('union', unionId);
    if (panchayatId) params.append('panchayat', panchayatId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return `/booths${qs}`;
  }, [unionId, panchayatId]);

  return (
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
      

      {/* Villages Card */}
      <div
        onClick={() => {
          const el = document.getElementById('villages-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 shadow-sm flex items-center gap-3 sm:gap-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
            {locale === 'ta' ? 'வருவாய் கிராமங்கள்' : 'Covered Villages'}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {villagesCount}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-medium text-blue-600 mt-0.5">
            {villagesCount > 0
              ? locale === 'ta'
                ? 'வருவாய் கிராமங்கள் & குடியிருப்புகள்'
                : 'Revenue villages & hamlets'
              : locale === 'ta'
              ? 'கிராமங்கள் எதுவும் இல்லை'
              : 'No villages listed'}
          </p>
        </div>
      </div>
      
      {/* Kilais Card */}
      <Link
        href={kilaisTargetUrl}
        className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 shadow-sm flex items-center gap-3 sm:gap-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Store className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
            {locale === 'ta' ? 'செயலில் உள்ள கிளைகள்' : 'Active Kilais'}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {kilaisCount}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-medium text-green-600 mt-0.5">
            {kilaisCount > 0
              ? locale === 'ta'
                ? 'களத்தில் செயலில் உள்ளது'
                : 'Grassroots active'
              : locale === 'ta'
              ? 'கிளை அமைக்கப்பட வேண்டும்'
              : 'Pending setup'}
          </p>
        </div>
      </Link>

      {/* Booths Card */}
      <Link
        href={boothsTargetUrl}
        className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 shadow-sm flex items-center gap-3 sm:gap-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
            {locale === 'ta' ? 'இணைக்கப்பட்ட சாவடிகள்' : 'Linked Booths'}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {boothsCount}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-medium text-orange-600 mt-0.5">
            {locale === 'ta' ? 'வாக்குச்சாவடி எல்லைகள்' : 'Polling Stations'} →
          </p>
        </div>
      </Link>

      {/* Cadres Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center shrink-0">
          <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold text-muted-foreground">
            {locale === 'ta' ? 'பதிவுசெய்த நிர்வாகிகள்' : 'Registered Cadres'}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {cadresCount}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-medium text-purple-600 mt-0.5">
            {locale === 'ta' ? 'கள நிர்வாகிகள்' : 'Across all kilais'}
          </p>
        </div>
      </div>
    </div>
  );
}

