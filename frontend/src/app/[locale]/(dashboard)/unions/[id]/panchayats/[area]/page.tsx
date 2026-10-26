'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUnion, useUnions } from '@/hooks/use-unions';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  ArrowLeft,
  Store,
  Building2,
  Users,
  MapPin,
  Compass,
  Phone,
  ShieldCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getOrgUnitName, getUnitTypeLabel } from '@/lib/org-unit-translations';
import {
  getAreaGeoData,
  getAreaBilingualNames,
  isAreaNameMatch,
  translateAreaToEnglish,
  translateAreaToTamil,
} from '@/lib/area-translations';
import PanchayatMapDynamic from '@/components/maps/panchayat-map-dynamic';
// Refreshed: Pure Leaflet + OpenStreetMap (No Google Maps API key required)
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { CadreCard } from '@/components/cadre-card';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { CadreViewDialog } from '@/components/cadre-view-dialog';
import { useQueryClient } from '@tanstack/react-query';

export default function PanchayatDetailsPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id as string | undefined;
  const rawAreaParam = params?.area as string;
  const areaParam = decodeURIComponent(rawAreaParam || '');

  const { data: directUnion, isLoading: isUnionLoading } = useUnion(rawId || '');
  const { data: allUnions } = useUnions();

  // If no direct union or union doesn't match area, search across all unions
  const union = useMemo(() => {
    if (directUnion) return directUnion;
    if (!allUnions || !areaParam) return null;
    return (
      allUnions.find((u: any) =>
        (u.areasCovered || []).some((a: string) => isAreaNameMatch(a, areaParam))
      ) || null
    );
  }, [directUnion, allUnions, areaParam]);

  const [activeTab, setActiveTab] = useState<'overview' | 'kilais' | 'booths' | 'cadres'>('overview');
  const [callConfirmation, setCallConfirmation] = useState<{ name: string; phone: string } | null>(null);
  const [viewingCadre, setViewingCadre] = useState<any | null>(null);
  const [isCadreModalOpen, setIsCadreModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Identify kilais belonging to this panchayat
  const panchayatKilais = useMemo(() => {
    if (!union?.kilais) return [];
    return union.kilais.filter(
      (k: any) =>
        isAreaNameMatch(k.panchayat, areaParam) ||
        (k.villages || []).some((v: string) => isAreaNameMatch(v, areaParam))
    );
  }, [union, areaParam]);

  // Resolve canonical area names & geographic coordinates
  const { en: areaNameEn, ta: areaNameTa } = useMemo(
    () => getAreaBilingualNames(areaParam),
    [areaParam]
  );

  const geoData = useMemo(
    () => getAreaGeoData(areaParam, panchayatKilais),
    [areaParam, panchayatKilais]
  );

  // Collect all booths under this panchayat's kilais
  const panchayatBooths = useMemo(() => {
    const boothMap = new Map<string, any>();
    panchayatKilais.forEach((k: any) => {
      (k.booths || []).forEach((b: any) => {
        if (!boothMap.has(b.id || b.boothNo)) {
          boothMap.set(b.id || b.boothNo, {
            ...b,
            kilaiName: k.name,
            kilaiTamilName: k.tamilName,
            kilaiId: k.id,
          });
        }
      });
    });
    return Array.from(boothMap.values());
  }, [panchayatKilais]);

  // Cadre count across these kilais
  const totalCadresCount = useMemo(() => {
    return panchayatKilais.reduce((sum: number, k: any) => sum + (k._count?.cadres || 0), 0);
  }, [panchayatKilais]);

  const isUnionUnit = (union?.unitType || 'UNION').toUpperCase() === 'UNION';
  const unitLabel = isUnionUnit
    ? locale === 'ta'
      ? 'ஊராட்சி'
      : 'Panchayat'
    : locale === 'ta'
      ? 'வார்டு'
      : 'Ward';

  if (isUnionLoading) {
    return (
      <div className="p-12 text-center text-gray-500 font-medium">
        {locale === 'ta' ? 'ஊராட்சி விவரங்களை ஏற்றுகிறது...' : 'Loading panchayat details...'}
      </div>
    );
  }

  const unionBackUrl = union ? `/unions/${union.id}` : '/unions';

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
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
                {areaNameEn !== areaNameTa && (
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                    ({locale === 'ta' ? areaNameEn : areaNameTa})
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm font-medium mt-1">
                {union ? getOrgUnitName(union, locale) : 'Union'} •{' '}
                {union?.district?.name || 'Cuddalore'} {locale === 'ta' ? 'மாவட்டம்' : 'District'} •{' '}
                {panchayatKilais.length} {locale === 'ta' ? 'கிளைகள்' : 'Kilais'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push(`/kilais?union=${union?.id || ''}`)}
              className="flex-1 sm:flex-initial text-xs font-semibold h-10 border-gray-200 hover:border-primary/50"
            >
              <Store className="w-4 h-4 mr-1.5 text-primary" />
              {locale === 'ta' ? 'கிளைகள் பட்டியல்' : 'All Kilais'}
            </Button>
            <Button
              onClick={() => setIsCadreModalOpen(true)}
              className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-10 shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {locale === 'ta' ? 'நிர்வாகியை சேர்' : 'Register Cadre'}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Executive Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
              {panchayatKilais.length}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-green-600 mt-0.5">
              {panchayatKilais.length > 0 ? (locale === 'ta' ? 'களத்தில் செயலில் உள்ளது' : 'Grassroots active') : (locale === 'ta' ? 'கிளை அமைக்கப்பட வேண்டும்' : 'Pending setup')}
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
              {panchayatBooths.length}
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
              {totalCadresCount}
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
              {geoData.isSurveyed ? (locale === 'ta' ? 'சரிபார்க்கப்பட்ட எல்லை' : 'GIS Surveyed') : (locale === 'ta' ? 'கள எல்லை தயார்' : 'Centroid Mapped')}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-blue-600 mt-0.5 font-mono">
              [{geoData.center[0].toFixed(5)}, {geoData.center[1].toFixed(5)}]
            </p>
          </div>
        </div>
      </div>

      {/* Classic Feature: Interactive Field Map & Intelligence Section */}
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
          key={`${geoData.center[0]}-${geoData.center[1]}-${areaParam}`}
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

      {/* Kilais under this Panchayat */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {locale === 'ta'
                ? `${areaNameTa} - கிளைகள்`
                : `Kilais in ${areaNameEn}`}
            </h2>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
              {panchayatKilais.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/kilais?union=${union?.id || ''}`)}
            className="text-xs text-primary font-semibold hover:bg-primary/5"
          >
            {locale === 'ta' ? 'அனைத்தையும் காண்க' : 'View All in Directory'} →
          </Button>
        </div>

        {panchayatKilais.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40">
            <Store className="w-10 h-10 text-gray-400 mx-auto mb-2.5 opacity-60" />
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
              {locale === 'ta'
                ? 'இந்த ஊராட்சியில் இதுவரை கிளைகள் பதிவு செய்யப்படவில்லை.'
                : 'No kilais registered under this panchayat yet.'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {locale === 'ta'
                ? 'புதிய கிளையை உருவாக்கி சாவடிகளையும் நிர்வாகிகளையும் இணைக்கவும்.'
                : 'Create a new kilai to link polling booths and grassroots cadres.'}
            </p>
            <Button
              size="sm"
              onClick={() => router.push('/kilais')}
              className="mt-4 bg-primary text-white font-semibold text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {locale === 'ta' ? 'புதிய கிளை உருவாக்கு' : 'Create New Kilai'}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {panchayatKilais.map((kilai: any) => {
              const kilaiBoothsCount = kilai.booths?.length || (kilai.linkedBooths?.length || 0);
              const kilaiCadresCount = kilai._count?.cadres || 0;

              return (
                <div
                  key={kilai.id}
                  onClick={() => router.push(`/kilais`)}
                  className="bg-white dark:bg-zinc-800/80 rounded-xl p-4 border border-gray-200 dark:border-zinc-700/80 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors text-base">
                          {locale === 'ta' && kilai.tamilName ? kilai.tamilName : kilai.name}
                        </h3>
                        {kilai.tamilName && locale !== 'ta' && (
                          <p className="text-xs text-muted-foreground font-medium">{kilai.tamilName}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          kilai.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700 border-green-200 text-[10px]'
                            : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                        }
                      >
                        {kilai.status === 'ACTIVE'
                          ? locale === 'ta'
                            ? 'செயலில்'
                            : 'Active'
                          : kilai.status}
                      </Badge>
                    </div>

                    {kilai.secretaryName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">{locale === 'ta' ? 'செயலாளர்' : 'Secretary'}:</span>{' '}
                        <span className="text-gray-800 dark:text-zinc-200 font-semibold">{kilai.secretaryName}</span>
                      </p>
                    )}

                    {kilai.villages && kilai.villages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {kilai.villages.slice(0, 3).map((v: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-gray-100 dark:bg-zinc-700/50 text-gray-600 dark:text-zinc-300 px-2 py-0.5 rounded"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-100 dark:border-zinc-700/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-300">
                      <Building2 className="w-3.5 h-3.5 text-orange-500" />
                      {kilaiBoothsCount} {locale === 'ta' ? 'சாவடிகள்' : 'Booths'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-300">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      {kilaiCadresCount} {locale === 'ta' ? 'நிர்வாகிகள்' : 'Cadres'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Linked Polling Booths */}
      {panchayatBooths.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {locale === 'ta' ? 'வாக்குச்சாவடிகள்' : 'Covered Polling Booths'}
              </h2>
              <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-bold">
                {panchayatBooths.length}
              </Badge>
            </div>
            <Link
              href="/booths"
              className="text-xs text-primary font-semibold hover:underline"
            >
              {locale === 'ta' ? 'சாவடிகள் மேலாண்மை' : 'Booths Management'} →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {panchayatBooths.map((booth: any, idx: number) => (
              <div
                key={booth.id || idx}
                className="p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-800/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                    #{booth.boothNo || idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {booth.name || `${locale === 'ta' ? 'சாவடி' : 'Booth'} ${booth.boothNo}`}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {locale === 'ta' ? 'கிளை' : 'Kilai'}: {booth.kilaiName}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-gray-300">
                  {booth.totalVoters ? `${booth.totalVoters} voters` : 'Active'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cadre Registration Modal */}
      <CadreFormDialog
        isOpen={isCadreModalOpen}
        onOpenChange={setIsCadreModalOpen}
        editingId={null}
        defaultLevel="UNION"
        lockLevel={false}
        defaultUnionId={union?.id}
        onSuccess={() => {
          if (union?.id) {
            queryClient.invalidateQueries({ queryKey: ['unions', union.id] });
          }
          queryClient.invalidateQueries({ queryKey: ['kilais'] });
        }}
      />

      <CallConfirmationDialog
        person={callConfirmation}
        onOpenChange={(open) => !open && setCallConfirmation(null)}
      />
    </div>
  );
}
