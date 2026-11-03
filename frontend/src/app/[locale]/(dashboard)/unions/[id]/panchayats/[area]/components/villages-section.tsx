'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Store, Building2, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VillagesSectionProps {
  villages: any[];
  areaNameEn: string;
  areaNameTa: string;
  locale: string;
}

// Helper to extract lowest numeric booth number for sorting
function getMinBoothNo(item: any): number {
  const booths = item.vBooths || item.booths || [];
  if (!booths || booths.length === 0) return 999999;
  const numbers = booths
    .map((b: any) => {
      const raw = String(b.boothNo || b.number || '').replace(/\D/g, '');
      return raw ? parseInt(raw, 10) : NaN;
    })
    .filter((n: number) => !isNaN(n));
  return numbers.length > 0 ? Math.min(...numbers) : 999999;
}

export function VillagesSection({
  villages,
  areaNameEn,
  areaNameTa,
  locale,
}: VillagesSectionProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'table' | 'tile'>('table');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('tile');
    }
  }, []);

  // Sort villages in ascending order by booth number, tie-breaking by name
  const sortedVillages = useMemo(() => {
    if (!villages) return [];
    return [...villages]
      .map((v: any) => {
        const rawBooths = v.vBooths || v.booths || [];
        const vBooths = [...rawBooths].sort((a: any, b: any) => {
          const numA = parseInt(String(a.boothNo || '').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(String(b.boothNo || '').replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
        return { ...v, vBooths };
      })
      .sort((a: any, b: any) => {
        const aMin = getMinBoothNo(a);
        const bMin = getMinBoothNo(b);
        if (aMin !== bMin) return aMin - bMin;
        return (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '');
      });
  }, [villages]);

  if (!sortedVillages || sortedVillages.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {locale === 'ta'
                  ? `${areaNameTa} - கிராமங்கள் / குடியிருப்புகள்`
                  : `Villages & Hamlets in ${areaNameEn}`}
              </h2>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 text-xs font-semibold">
                {sortedVillages.length} {locale === 'ta' ? 'கிராமங்கள்' : 'Villages'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === 'ta'
                ? 'இந்த ஊராட்சியின் கீழ் உள்ள கிராமங்கள் மற்றும் அவற்றுடன் இணைக்கப்பட்ட கிளைகள் & சாவடிகள்'
                : 'Revenue villages, hamlets, and their assigned TVK Kilais & Polling Booths'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Table / Tile */}
        <div className="flex items-center self-start sm:self-auto bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700/60 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-zinc-900 text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={locale === 'ta' ? 'அட்டவணை காட்சி' : 'Table View'}
          >
            <List className="w-3.5 h-3.5" />
            <span>{locale === 'ta' ? 'அட்டவணை' : 'Table'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tile')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'tile'
                ? 'bg-white dark:bg-zinc-900 text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={locale === 'ta' ? 'கட்டக் காட்சி' : 'Tile View'}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{locale === 'ta' ? 'கட்டம்' : 'Tiles'}</span>
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <Table>
            <TableHeader className="bg-gray-50/80 dark:bg-zinc-800/50">
              <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-zinc-800">
                <TableHead className="w-12 text-center text-xs font-bold text-gray-500 dark:text-zinc-400">#</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                  {locale === 'ta' ? 'கிராமம் / குடியிருப்பு' : 'Village / Locality'}
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5">
                  {locale === 'ta' ? 'இணைக்கப்பட்ட கிளைகள்' : 'Assigned Kilais'}
                </TableHead>
                <TableHead className="w-44 text-xs font-bold text-gray-700 dark:text-zinc-200 py-3.5 text-center">
                  {locale === 'ta' ? 'சாவடி எண்' : 'Booth No.'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVillages.map((village: any, idx: number) => (
                <TableRow
                  key={village.id}
                  onClick={() => router.push(village.villageDetailUrl)}
                  className="group cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors border-b border-gray-100 dark:border-zinc-800/80"
                >
                  <TableCell className="text-center text-xs font-medium text-muted-foreground py-3">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {village.displayName}
                      </span>
                      {village.secondaryName && (
                        <span className="text-xs text-muted-foreground">
                          {village.secondaryName}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {village.vKilais && village.vKilais.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {village.vKilais.map((vk: any) => (
                          <span
                            key={vk.id}
                            className="text-[11px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-md font-medium"
                          >
                            {locale === 'ta' && vk.tamilName ? vk.tamilName : vk.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {locale === 'ta' ? 'கிளைகள் இணைக்கப்படவில்லை' : 'No kilai linked'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    {village.vBooths && village.vBooths.length > 0 ? (
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {village.vBooths.map((b: any) => (
                          <span
                            key={b.id || b.boothNo}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 shadow-2xs"
                          >
                            <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            #{b.boothNo}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedVillages.map((village: any) => (
            <div
              key={village.id}
              onClick={() => router.push(village.villageDetailUrl)}
              className="group cursor-pointer p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {village.displayName}
                    </h3>
                    {village.secondaryName && (
                      <p className="text-xs text-muted-foreground font-medium">
                        {village.secondaryName}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                </div>

                {/* Linked Kilais Pill */}
                <div className="mt-3 space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {locale === 'ta' ? 'கிளைகள்:' : 'Assigned Kilais:'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {village.vKilais && village.vKilais.length > 0 ? (
                      village.vKilais.map((vk: any) => (
                        <span
                          key={vk.id}
                          className="text-[11px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-md font-medium"
                        >
                          {locale === 'ta' && vk.tamilName ? vk.tamilName : vk.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">
                        {locale === 'ta' ? 'கிளைகள் இணைக்கப்படவில்லை' : 'No kilai linked'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2.5 mt-3 border-t border-gray-100 dark:border-zinc-700/50 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-300">
                    <Store className="w-3.5 h-3.5 text-green-600" />
                    {village.vKilais?.length || 0} {locale === 'ta' ? 'கிளைகள்' : 'Kilais'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {village.vBooths && village.vBooths.length > 0 ? (
                      village.vBooths.map((b: any) => (
                        <span
                          key={b.id || b.boothNo}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80"
                        >
                          <Building2 className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                          #{b.boothNo}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">-</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
                  {locale === 'ta' ? 'விவரங்கள்' : 'View'} →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

