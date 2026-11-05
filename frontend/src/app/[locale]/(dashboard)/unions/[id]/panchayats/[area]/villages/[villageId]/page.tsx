'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useVillage } from '@/hooks/use-villages';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import {
  ArrowLeft,
  Store,
  Building2,
  Users,
  MapPin,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Activity,
  AlertCircle,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PanchayatMapDynamic from '@/components/maps/panchayat-map-dynamic';
import { getUnionSlug } from '@/lib/org-unit-translations';
import { getAreaGeoData, generateDynamicAreaBoundary } from '@/lib/area-translations';
import { KilaisSection } from '../../components/kilais-section';
import { BoothsSection } from '../../components/booths-section';

export default function VillageDetailsPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();

  const unionId = params?.id as string | undefined;
  const rawAreaParam = params?.area as string | undefined;
  const areaParam = decodeURIComponent(rawAreaParam || '');
  const villageId = params?.villageId as string;

  const { data: village, isLoading, error } = useVillage(villageId);

  // Canonicalize URL: redirect UUIDs or nested union paths to clean /panchayats/[panchayatSlug]/villages/[villageSlug]
  React.useEffect(() => {
    if (!village) return;
    const cleanVillageSlug = village.code || village.name?.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPanchayatSlug = village.panchayat?.code || areaParam;
    if (!cleanVillageSlug) return;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(villageId);
    if (unionId || isUuid) {
      router.replace(`/panchayats/${encodeURIComponent(cleanPanchayatSlug)}/villages/${cleanVillageSlug}`);
    }
  }, [village, unionId, villageId, areaParam, router]);

  // Compute total voters across all booths of this village
  const voterStats = useMemo(() => {
    if (!village?.booths || village.booths.length === 0) {
      return { total: 0, male: 0, female: 0, thirdGender: 0 };
    }
    return village.booths.reduce(
      (acc: any, b: any) => ({
        total: acc.total + (b.totalCount || 0),
        male: acc.male + (b.maleCount || 0),
        female: acc.female + (b.femaleCount || 0),
        thirdGender: acc.thirdGender + (b.thirdGenderCount || 0),
      }),
      { total: 0, male: 0, female: 0, thirdGender: 0 }
    );
  }, [village]);

  // Compute total TVK cadres across assigned kilais + booth agents
  const totalCadresCount = useMemo(() => {
    let cadres = 0;
    (village?.kilais || []).forEach((k: any) => {
      cadres += k._count?.cadres || (k.cadres ? k.cadres.length : 0);
    });
    (village?.booths || []).forEach((b: any) => {
      cadres += b._count?.agents || 0;
    });
    return cadres;
  }, [village]);

  // Prepare map data with guaranteed center and boundary
  const geoData = useMemo(() => {
    if (!village) return null;

    // Collect any GPS points from assigned kilais and booths
    const associatedPoints: [number, number][] = [];
    (village.kilais || []).forEach((k: any) => {
      if (k.latitude && k.longitude) {
        associatedPoints.push([Number(k.latitude), Number(k.longitude)]);
      }
      (k.booths || []).forEach((b: any) => {
        if (b.latitude && b.longitude) {
          associatedPoints.push([Number(b.latitude), Number(b.longitude)]);
        }
      });
    });
    (village.booths || []).forEach((b: any) => {
      if (b.latitude && b.longitude) {
        associatedPoints.push([Number(b.latitude), Number(b.longitude)]);
      }
    });

    // Determine center coordinates: village center -> panchayat center -> kilai/booth centroid -> areaGeoData fallback
    let center: [number, number];
    if (village.centerLat && village.centerLng) {
      center = [village.centerLat, village.centerLng];
    } else if (village.panchayat?.centerLat && village.panchayat?.centerLng) {
      center = [village.panchayat.centerLat, village.panchayat.centerLng];
    } else if (associatedPoints.length > 0) {
      const avgLat = associatedPoints.reduce((sum, p) => sum + p[0], 0) / associatedPoints.length;
      const avgLng = associatedPoints.reduce((sum, p) => sum + p[1], 0) / associatedPoints.length;
      center = [Number(avgLat.toFixed(5)), Number(avgLng.toFixed(5))];
    } else {
      const fallback = getAreaGeoData(village.name || areaParam, village.kilais || []);
      center = fallback.center;
    }

    // Determine boundary: DB boundary -> generated organic village boundary
    const dbBoundary = village.boundary as [number, number][] | null | undefined;
    const hasDbBoundary = Array.isArray(dbBoundary) && dbBoundary.length > 2;

    const boundaryCoords = hasDbBoundary
      ? (dbBoundary as [number, number][])
      : generateDynamicAreaBoundary(center, village.name || 'Village', associatedPoints, 0.85);

    return {
      center,
      boundaryCoords,
      isSurveyed: hasDbBoundary,
    };
  }, [village, areaParam]);

  const effectiveUnion = village?.panchayat?.union;
  const effectiveUnionSlug = getUnionSlug(effectiveUnion?.name) || (unionId && unionId !== 'all' ? unionId : effectiveUnion?.id);
  const effectiveUnionName = effectiveUnion?.name || (locale === 'ta' ? 'ஒன்றியம்' : 'Union');
  const panchayatSlug = village?.panchayat?.code || areaParam;
  const panchayatBackUrl = `/panchayats/${encodeURIComponent(panchayatSlug)}`;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {locale === 'ta' ? 'கிராம விவரங்களை ஏற்றுகிறது...' : 'Loading village details...'}
        </p>
      </div>
    );
  }

  if (error || !village) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">
          {locale === 'ta' ? 'கிராமம் கிடைக்கவில்லை' : 'Village Not Found'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {locale === 'ta'
            ? 'கோரப்பட்ட கிராமத் தகவலைப் பெற முடியவில்லை.'
            : 'Could not load details for the requested village.'}
        </p>
        <Button onClick={() => router.push(panchayatBackUrl)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {locale === 'ta' ? 'ஊராட்சிப் பக்கத்திற்குத் திரும்பு' : 'Back to Panchayat'}
        </Button>
      </div>
    );
  }

  const villageName = locale === 'ta' && village.nameTa ? village.nameTa : village.name;
  const villageAltName = locale === 'ta' ? village.name : village.nameTa;
  const panchayatName = village.panchayat
    ? (locale === 'ta' && village.panchayat.nameTa ? village.panchayat.nameTa : village.panchayat.name)
    : areaParam;
  const unionName = village.panchayat?.union?.name || '';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header Navigation & Breadcrumbs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href="/unions" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>{locale === 'ta' ? 'ஒன்றியங்கள்' : 'Unions'}</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
          {effectiveUnionSlug && (
            <>
              <Link href={`/unions/${effectiveUnionSlug}`} className="hover:text-foreground transition-colors">
                {effectiveUnionName}
              </Link>
              <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            </>
          )}
          <Link href={panchayatBackUrl} className="hover:text-foreground transition-colors font-medium">
            {panchayatName}
          </Link>
          <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-foreground font-semibold truncate max-w-[200px]">
            {villageName}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {villageName}
              </h1>
              {villageAltName && villageAltName !== villageName && (
                <span className="text-lg font-semibold text-muted-foreground">
                  ({villageAltName})
                </span>
              )}
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200">
                {locale === 'ta' ? 'வருவாய் கிராமம் / குடியிருப்பு' : 'Revenue Village / Hamlet'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
              <span>
                {locale === 'ta'
                  ? `${panchayatName} ஊராட்சிக்கு உட்பட்ட பகுதி`
                  : `Under ${panchayatName} Panchayat`}
              </span>
              {unionName && (
                <>
                  <span>•</span>
                  <span>{unionName}</span>
                </>
              )}
              {/* {village.centerLat && (
                <>
                  <span>•</span>
                  <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
                    📍 {village.centerLat.toFixed(4)}° N, {village.centerLng?.toFixed(4)}° E
                  </span>
                </>
              )} */}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(panchayatBackUrl)}
            className="self-start sm:self-auto h-9 font-semibold text-xs border-gray-200 dark:border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            {locale === 'ta' ? `← ${panchayatName} பக்கத்திற்குத் திரும்பு` : `Back to ${panchayatName}`}
          </Button>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Kilais */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-600 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {locale === 'ta' ? 'இணைக்கப்பட்ட கிளைகள்' : 'Assigned Kilais'}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {village.kilais?.length || 0}
            </p>
          </div>
        </div>

        {/* KPI 2: Booths */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {locale === 'ta' ? 'வாக்குச்சாவடிகள்' : 'Polling Booths'}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {village.booths?.length || 0}
            </p>
          </div>
        </div>

        {/* KPI 3: Registered Voters */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {locale === 'ta' ? 'பதிவுசெய்த வாக்காளர்கள்' : 'Registered Voters'}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {voterStats.total.toLocaleString()}
              </span>
              {voterStats.total > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  (♂{voterStats.male} ♀{voterStats.female})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 4: Cadres & Agents */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {locale === 'ta' ? 'நிர்வாகிகள் & முகவர்கள்' : 'Cadres & Agents'}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {totalCadresCount}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Assigned Kilais Section */}
      <KilaisSection
        kilais={village.kilais}
        title={
          locale === 'ta'
            ? `${villageName} - கிளை அமைப்புகள்`
            : `Kilais Assigned to ${villageName}`
        }
        subtitle={
          locale === 'ta'
            ? 'இந்த கிராமப் பகுதியில் களப்பணியாற்றும் கழகக் கிளை அமைப்புகள் & நிர்வாகிகள்'
            : 'Grassroot Kilai units actively overseeing field operations and cadres in this village'
        }
        areaNameEn={village.name}
        areaNameTa={village.nameTa}
        unionId={effectiveUnionSlug}
        locale={locale}
      />

      {/* 4. Polling Booths & Electoral Roll Section */}
      <BoothsSection
        booths={village.booths}
        title={
          locale === 'ta'
            ? `${villageName} - வாக்குச்சாவடிகள் & வாக்காளர் விவரங்கள்`
            : `Polling Booths & Electoral Roll for ${villageName}`
        }
        subtitle={
          locale === 'ta'
            ? 'இந்த கிராமப் பகுதி வாக்காளர்களைக் கொண்ட வாக்குச்சாவடிகள் மற்றும் வாக்காளர் எண்ணிக்கை'
            : 'Designated polling stations and voter demographics covering this village area'
        }
        showAssignedKilai={false}
        areaNameEn={village.name}
        areaNameTa={village.nameTa}
        locale={locale}
      />

      {/* 5. Geographic Map (always rendered when village loaded) */}
      {geoData && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {locale === 'ta' ? `${villageName} - வரைபடம்` : `${villageName} - Field Location`}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {locale === 'ta'
                    ? 'புவியியல் அமைவிடம் மற்றும் கள எல்லைப் பரப்பு'
                    : 'Geographic coordinate position and field boundary'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {geoData.center[0].toFixed(4)}° N, {geoData.center[1].toFixed(4)}° E
            </span>
          </div>

          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800">
            <PanchayatMapDynamic
              key={`${geoData.center[0]}-${geoData.center[1]}-${geoData.boundaryCoords.length}-${village.id || villageId}`}
              center={geoData.center}
              boundaryCoords={geoData.boundaryCoords}
              title={villageName}
              subtitle={panchayatName ? `${panchayatName} • ${unionName}` : ''}
              englishTitle={village.name}
              tamilTitle={village.nameTa}
              kilaiCount={village.kilais?.length || 0}
              boothCount={village.booths?.length || 0}
              cadreCount={totalCadresCount}
              kilais={village.kilais || []}
              locale={locale}
              height="450px"
            />
          </div>
        </div>
      )}

    </div>
  );
}
