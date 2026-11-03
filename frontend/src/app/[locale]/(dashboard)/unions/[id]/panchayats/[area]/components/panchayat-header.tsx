'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Store, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getOrgUnitName, getUnionSlug } from '@/lib/org-unit-translations';

interface PanchayatHeaderProps {
  union: any;
  areaNameEn: string;
  areaNameTa: string;
  unitLabel: string;
  panchayatKilaisCount: number;
  locale: string;
  onRegisterCadre: () => void;
}

export function PanchayatHeader({
  union,
  areaNameEn,
  areaNameTa,
  unitLabel,
  panchayatKilaisCount,
  locale,
  onRegisterCadre,
}: PanchayatHeaderProps) {
  const router = useRouter();
  const unionBackUrl = union ? `/unions/${getUnionSlug(union.name) || union.id}` : '/unions';

  return (
    <div className="flex flex-col gap-3">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground flex-wrap">
        <Link href="/unions" className="hover:text-primary transition-colors">
          {locale === 'ta' ? 'அமைப்பு அலகுகள்' : 'Organizational Units'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        {union && (
          <>
            <Link href={unionBackUrl} className="hover:text-primary transition-colors">
              {getOrgUnitName(union, locale)}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </>
        )}
        <span className="text-gray-900 dark:text-white font-bold">
          {locale === 'ta' ? areaNameTa : areaNameEn}
        </span>
      </div>

      {/* Header Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href={unionBackUrl}
            className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-full border border-gray-200 dark:border-zinc-700 shadow-sm hover:bg-gray-100 hover:text-primary transition-colors"
            title={locale === 'ta' ? 'பின்செல்க' : 'Go Back'}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-gray-900 dark:text-white">
                {locale === 'ta' ? areaNameTa : areaNameEn}
              </h1>
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-xs px-2.5 py-0.5 font-bold">
                {unitLabel}
              </Badge>
              {/* {areaNameEn !== areaNameTa && (
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  ({locale === 'ta' ? areaNameEn : areaNameTa})
                </span>
              )} */}
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm font-medium mt-1">
              {union ? getOrgUnitName(union, locale) : 'Union'}
              {/* {union?.district?.name || 'Cuddalore'} {locale === 'ta' ? 'மாவட்டம்' : 'District'} •{' '}
              {panchayatKilaisCount} {locale === 'ta' ? 'கிளைகள்' : 'Kilais'} */}
            </p>
          </div>
        </div>

        {/* <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => router.push(`/kilais?union=${union?.id || ''}`)}
            className="flex-1 sm:flex-initial text-xs font-semibold h-10 border-gray-200 hover:border-primary/50"
          >
            <Store className="w-4 h-4 mr-1.5 text-primary" />
            {locale === 'ta' ? 'கிளைகள் பட்டியல்' : 'All Kilais'}
          </Button>
          <Button
            onClick={onRegisterCadre}
            className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-10 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {locale === 'ta' ? 'நிர்வாகியை சேர்' : 'Register Cadre'}
          </Button>
        </div> */}
      </div>
    </div>
  );
}

