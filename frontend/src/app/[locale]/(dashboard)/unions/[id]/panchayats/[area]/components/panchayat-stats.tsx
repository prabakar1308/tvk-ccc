'use client';

import React from 'react';
import { Store, Building2, Users, Compass } from 'lucide-react';

interface PanchayatStatsProps {
  kilaisCount: number;
  boothsCount: number;
  cadresCount: number;
  geoData: {
    center: [number, number];
    boundaryCoords: [number, number][];
    isSurveyed: boolean;
  };
  locale: string;
}

export function PanchayatStats({
  kilaisCount,
  boothsCount,
  cadresCount,
  geoData,
  locale,
}: PanchayatStatsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
      {/* Kilais Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center shrink-0">
          <Store className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold text-muted-foreground">
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
      </div>

      {/* Booths Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold text-muted-foreground">
            {locale === 'ta' ? 'இணைக்கப்பட்ட சாவடிகள்' : 'Linked Booths'}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {boothsCount}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-medium text-orange-600 mt-0.5">
            {locale === 'ta' ? 'வாக்குச்சாவடி எல்லைகள்' : 'Polling Stations'}
          </p>
        </div>
      </div>

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

      {/* Geographic / Map Status Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-primary/20 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
          <Compass className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold text-muted-foreground">
            {locale === 'ta' ? 'புவிசார் கள எல்லை' : 'Geospatial Status'}
          </p>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight">
            {geoData.isSurveyed
              ? locale === 'ta'
                ? 'சரிபார்க்கப்பட்ட எல்லை'
                : 'GIS Surveyed'
              : locale === 'ta'
              ? 'கள எல்லை தயார்'
              : 'Centroid Mapped'}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-medium text-blue-600 mt-0.5 font-mono">
            [{geoData.center[0].toFixed(5)}, {geoData.center[1].toFixed(5)}]
          </p>
        </div>
      </div>
    </div>
  );
}

