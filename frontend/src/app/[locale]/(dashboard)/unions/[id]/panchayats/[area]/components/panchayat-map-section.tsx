'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import PanchayatMapDynamic from '@/components/maps/panchayat-map-dynamic';
import { getOrgUnitName, getUnitTypeLabel } from '@/lib/org-unit-translations';

interface PanchayatMapSectionProps {
  geoData: {
    center: [number, number];
    boundaryCoords: [number, number][];
    isSurveyed: boolean;
  };
  areaNameEn: string;
  areaNameTa: string;
  areaParam: string;
  union: any;
  panchayatKilais: any[];
  panchayatBooths: any[];
  totalCadresCount: number;
  locale: string;
  onSaveGeo: (geo: { center: [number, number]; boundaryCoords: [number, number][] }) => void;
}

export function PanchayatMapSection({
  geoData,
  areaNameEn,
  areaNameTa,
  areaParam,
  union,
  panchayatKilais,
  panchayatBooths,
  totalCadresCount,
  locale,
  onSaveGeo,
}: PanchayatMapSectionProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {locale === 'ta'
                ? 'கள வரைபடம் & புவிசார் எல்லைப் பார்வை'
                : 'Interactive Field Map & Geographic Boundary'}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === 'ta'
              ? 'ஊராட்சி சாலை வரைபடம், புவி எல்லைப் பரப்பு மற்றும் வாக்குச்சாவடிகள்'
              : 'Road map layer, perimeter boundary polygon, and polling station centers'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            {locale === 'ta' ? 'அதிகாரப்பூர்வ வருவாய் எல்லை வரைபடம்' : 'Official Revenue Boundary Map'}
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <PanchayatMapDynamic
        key={`${geoData.center[0]}-${geoData.center[1]}-${geoData.boundaryCoords.length}-${areaParam}`}
        center={geoData.center}
        boundaryCoords={geoData.boundaryCoords}
        title={locale === 'ta' ? areaNameTa : areaNameEn}
        subtitle={union ? `${getOrgUnitName(union, locale)} • ${union.district?.name || 'Cuddalore'}` : ''}
        englishTitle={areaNameEn}
        tamilTitle={areaNameTa}
        kilaiCount={panchayatKilais.length}
        boothCount={panchayatBooths.length}
        cadreCount={totalCadresCount}
        kilais={panchayatKilais}
        locale={locale}
        height="520px"
        onSaveGeo={onSaveGeo}
      />

      {/* Map Notes & Intelligence Bar */}
      <div className="grid sm:grid-cols-3 gap-3 pt-1 text-xs">
        <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200/60 dark:border-zinc-700/50">
          <p className="font-semibold text-gray-900 dark:text-white mb-0.5">
            {locale === 'ta' ? 'அமைவிடம்' : 'Geographic Centroid'}
          </p>
          <p className="text-muted-foreground font-mono text-[11px]">
            {geoData.center[0].toFixed(5)}° N, {geoData.center[1].toFixed(5)}° E
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200/60 dark:border-zinc-700/50">
          <p className="font-semibold text-gray-900 dark:text-white mb-0.5">
            {locale === 'ta' ? 'வருவாய் பகுதி' : 'Administrative Scope'}
          </p>
          <p className="text-muted-foreground text-[11px]">
            {union ? getOrgUnitName(union, locale) : 'Union'} ({getUnitTypeLabel(union?.unitType, locale)})
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200/60 dark:border-zinc-700/50">
          <p className="font-semibold text-gray-900 dark:text-white mb-0.5">
            {locale === 'ta' ? 'கள நிலவரம்' : 'Field Readiness'}
          </p>
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
            {panchayatKilais.length > 0
              ? locale === 'ta'
                ? 'களக் குழுக்கள் செயலில் உள்ளன'
                : 'Field units operational'
              : locale === 'ta'
              ? 'அமைப்பு உருவாக்கம் தேவை'
              : 'Unit registration needed'}
          </p>
        </div>
      </div>
    </div>
  );
}

