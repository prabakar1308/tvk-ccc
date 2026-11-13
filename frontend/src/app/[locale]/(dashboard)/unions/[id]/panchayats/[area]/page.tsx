'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useUnion, useUnions } from '@/hooks/use-unions';
import { useLocale } from 'next-intl';
import {
  getAreaGeoData,
  getAreaBilingualNames,
  isAreaNameMatch,
  generateDynamicAreaBoundary,
  translateAreaToEnglish,
  createAreaSlug,
} from '@/lib/area-translations';
import { usePanchayat, useUpdatePanchayatGeo } from '@/hooks/use-panchayats';
import { useBooths } from '@/hooks/use-booths';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';
import { CadreFormDialog } from '@/components/cadre-form-dialog';
import { useQueryClient } from '@tanstack/react-query';

import { PanchayatHeader } from './components/panchayat-header';
import { PanchayatStats } from './components/panchayat-stats';
import { PanchayatMapSection } from './components/panchayat-map-section';
import { VillagesSection } from './components/villages-section';
import { KilaisSection } from './components/kilais-section';
import { BoothsSection } from './components/booths-section';

// Helper to extract lowest numeric booth number for sorting
function getMinBoothNo(item: any): number {
  const booths = item.vBooths || item.booths || item.linkedBooths || [];
  if (!booths || booths.length === 0) return 999999;
  const numbers = booths
    .map((b: any) => {
      const raw = String(b.boothNo || b.number || '').replace(/\D/g, '');
      return raw ? parseInt(raw, 10) : NaN;
    })
    .filter((n: number) => !isNaN(n));
  return numbers.length > 0 ? Math.min(...numbers) : 999999;
}

export default function PanchayatDetailsPage() {
  const locale = useLocale();
  const params = useParams();
  const rawId = params?.id as string | undefined;
  const rawAreaParam = params?.area as string;
  const areaParam = decodeURIComponent(rawAreaParam || '');
  const resolvedAreaParam = /[\u0B80-\u0BFF]/.test(areaParam)
    ? translateAreaToEnglish(areaParam) || areaParam
    : areaParam;

  const { data: dbPanchayat, isLoading: isPanchayatLoading } = usePanchayat(resolvedAreaParam);
  const targetPanchayatId = dbPanchayat?.id || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedAreaParam) ? resolvedAreaParam : undefined);
  const { data: dedicatedBooths } = useBooths(targetPanchayatId ? { panchayatId: targetPanchayatId } : undefined);
  const updateGeoMutation = useUpdatePanchayatGeo();
  const { data: directUnion, isLoading: isUnionLoading } = useUnion(rawId || '');
  const { data: allUnions } = useUnions();

  // If no direct union or union doesn't match area, search across all unions
  const union = useMemo(() => {
    if (dbPanchayat?.union) return dbPanchayat.union;
    if (directUnion) return directUnion;
    if (!allUnions || !resolvedAreaParam) return null;
    return (
      allUnions.find((u: any) =>
        (u.areasCovered || []).some((a: string) => isAreaNameMatch(a, resolvedAreaParam) || isAreaNameMatch(a, areaParam))
      ) || null
    );
  }, [dbPanchayat, directUnion, allUnions, resolvedAreaParam, areaParam]);

  const router = useRouter();

  // Canonicalize URL to Option 1 clean slug: /panchayats/[code]
  useEffect(() => {
    if (!dbPanchayat) return;
    const cleanSlug = dbPanchayat.code || createAreaSlug(dbPanchayat.nameEn || dbPanchayat.englishName || dbPanchayat.name);
    if (!cleanSlug) return;

    const isCurrentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(areaParam);
    const isTamil = /[\u0B80-\u0BFF]/.test(areaParam);
    // If accessed via /unions/[id]/panchayats/[area], with a UUID, or with Tamil, replace with clean English /panchayats/[code]
    if (rawId || isCurrentUuid || isTamil) {
      router.replace(`/panchayats/${cleanSlug}`);
    }
  }, [dbPanchayat, rawId, areaParam, router]);

  const [callConfirmation, setCallConfirmation] = useState<{ name: string; phone: string } | null>(null);
  const [isCadreModalOpen, setIsCadreModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Identify kilais belonging to this panchayat, sorted by booth number
  const panchayatKilais = useMemo(() => {
    let rawList: any[] = [];
    if (dbPanchayat?.kilais && dbPanchayat.kilais.length > 0) {
      rawList = dbPanchayat.kilais;
    } else if (union?.kilais) {
      rawList = union.kilais.filter(
        (k: any) =>
          isAreaNameMatch(k.panchayat, areaParam) ||
          (k.villages || []).some((v: string) => isAreaNameMatch(v, areaParam))
      );
    }

    // Sort internal booths for each kilai numerically
    const withSortedBooths = rawList.map((k: any) => {
      const bList = k.booths || k.linkedBooths;
      if (bList && bList.length > 1) {
        const sortedBooths = [...bList].sort((a: any, b: any) => {
          const numA = parseInt(String(a.boothNo || '').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(String(b.boothNo || '').replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
        return { ...k, booths: sortedBooths };
      }
      return k;
    });

    // Sort kilais in ascending order by lowest booth number, tie-breaking by name
    return withSortedBooths.sort((a: any, b: any) => {
      const aMin = getMinBoothNo(a);
      const bMin = getMinBoothNo(b);
      if (aMin !== bMin) return aMin - bMin;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [dbPanchayat, union, areaParam]);

  // Villages under this panchayat
  const villages = useMemo(() => {
    return dbPanchayat?.villages || [];
  }, [dbPanchayat]);

  // Resolve canonical area names & geographic coordinates
  const { en: legacyEn, ta: legacyTa } = useMemo(
    () => getAreaBilingualNames(areaParam),
    [areaParam]
  );

  const areaNameEn = dbPanchayat?.name || legacyEn;
  const areaNameTa = dbPanchayat?.nameTa || legacyTa;

  // Collect only booths related strictly to the selected panchayat
  const panchayatBooths = useMemo(() => {
    const pId = targetPanchayatId;

    // Primary: booths specifically fetched for this panchayat or dbPanchayat.booths
    let candidateBooths = dedicatedBooths && dedicatedBooths.length > 0
      ? dedicatedBooths
      : (dbPanchayat?.booths || []);

    // Fallback: if candidateBooths is empty, check booths in kilais that are assigned to this panchayat
    if (candidateBooths.length === 0 && pId) {
      const boothMap = new Map<string, any>();
      panchayatKilais.forEach((k: any) => {
        (k.booths || []).forEach((b: any) => {
          if (b.panchayatId === pId) {
            boothMap.set(b.id || b.boothNo, {
              ...b,
              kilaiName: k.name,
              kilaiTamilName: k.tamilName,
              kilaiId: k.id,
            });
          }
        });
      });
      candidateBooths = Array.from(boothMap.values());
    }

    // Filter strictly to ensure ONLY booths belonging to this selected panchayat are included
    const filtered = candidateBooths.filter((b: any) => {
      if (pId) {
        return b.panchayatId === pId;
      }
      return (
        isAreaNameMatch(b.area, areaParam) ||
        isAreaNameMatch(b.area, areaNameEn) ||
        isAreaNameMatch(b.area, areaNameTa)
      );
    });

    // Natural sort by boothNo (e.g. 72, 73, 74, 75, 77, 78, 79)
    const sorted = [...filtered].sort((a: any, b: any) =>
      String(a.boothNo || '').localeCompare(String(b.boothNo || ''), undefined, { numeric: true })
    );

    return sorted.map((b: any) => {
      // Find all kilais in panchayatKilais that reference this booth
      const linkedFromKilaiList = panchayatKilais.filter((k: any) =>
        (k.booths || []).some((kb: any) => kb.id === b.id || String(kb.boothNo) === String(b.boothNo)) ||
        (k.linkedBooths || []).some((bNo: string) => String(bNo) === String(b.boothNo))
      );

      // Merge booth's existing kilais with any matched from panchayatKilais
      const combinedKilaisMap = new Map<string, any>();
      (b.kilais || []).forEach((k: any) => {
        if (k.id) combinedKilaisMap.set(k.id, k);
        else if (k.name) combinedKilaisMap.set(k.name, k);
      });
      linkedFromKilaiList.forEach((k: any) => {
        if (k.id && !combinedKilaisMap.has(k.id)) combinedKilaisMap.set(k.id, k);
        else if (k.name && !combinedKilaisMap.has(k.name)) combinedKilaisMap.set(k.name, k);
      });

      const combinedKilais = Array.from(combinedKilaisMap.values());

      return {
        ...b,
        kilais: combinedKilais.length > 0 ? combinedKilais : b.kilais,
        kilaiName: combinedKilais[0]?.name || b.kilais?.[0]?.name || b.kilaiName || (locale === 'ta' ? 'இணைக்கப்பட்டது' : 'Assigned'),
        kilaiTamilName: combinedKilais[0]?.translations?.ta?.name || combinedKilais[0]?.tamilName || b.kilais?.[0]?.translations?.ta?.name || b.kilaiTamilName || b.kilais?.[0]?.name || b.kilaiName,
        kilaiId: combinedKilais[0]?.id || b.kilais?.[0]?.id || b.kilaiId,
      };
    });
  }, [dedicatedBooths, dbPanchayat, targetPanchayatId, panchayatKilais, areaParam, areaNameEn, areaNameTa, locale]);

  const geoData = useMemo(() => {
    // Collect all associated coordinates from Kilais and Booths for precise boundary coverage
    const associatedPoints: [number, number][] = [];
    panchayatKilais.forEach((k: any) => {
      if (k.latitude && k.longitude) {
        associatedPoints.push([Number(k.latitude), Number(k.longitude)]);
      }
      (k.booths || []).forEach((b: any) => {
        if (b.latitude && b.longitude) {
          associatedPoints.push([Number(b.latitude), Number(b.longitude)]);
        }
      });
    });
    panchayatBooths.forEach((b: any) => {
      if (b.latitude && b.longitude) {
        associatedPoints.push([Number(b.latitude), Number(b.longitude)]);
      }
    });

    // Check if database already holds an official surveyed polygon
    const dbBoundary = dbPanchayat?.boundary as [number, number][] | null | undefined;
    const hasDbBoundary = Array.isArray(dbBoundary) && dbBoundary.length > 2;

    if (dbPanchayat?.centerLat && dbPanchayat?.centerLng) {
      const center: [number, number] = [dbPanchayat.centerLat, dbPanchayat.centerLng];
      const boundaryCoords = hasDbBoundary
        ? (dbBoundary as [number, number][])
        : generateDynamicAreaBoundary(center, areaNameEn, associatedPoints);

      return {
        center,
        boundaryCoords,
        isSurveyed: hasDbBoundary,
      };
    }

    // Fallback to area name resolution
    const fallbackGeo = getAreaGeoData(areaParam, panchayatKilais);
    const boundaryCoords = fallbackGeo.boundaryCoords && fallbackGeo.boundaryCoords.length > 2
      ? fallbackGeo.boundaryCoords
      : generateDynamicAreaBoundary(fallbackGeo.center, areaNameEn, associatedPoints);

    return {
      center: fallbackGeo.center,
      boundaryCoords,
      isSurveyed: fallbackGeo.isSurveyed,
    };
  }, [dbPanchayat, areaParam, areaNameEn, panchayatKilais, panchayatBooths]);

  // Enriched village data with linked kilais and booths
  const enrichedVillages = useMemo(() => {
    const mapped = villages.map((village: any) => {
      // Match kilais linked to this village
      const vKilais = village.kilais && village.kilais.length > 0
        ? village.kilais
        : panchayatKilais.filter((k: any) =>
            (k.villagesRel || []).some((vr: any) => vr.id === village.id || vr.name === village.name) ||
            (k.villages || []).some((vn: string) => isAreaNameMatch(vn, village.name)) ||
            isAreaNameMatch(k.name, village.name)
          );

      // Match booths linked to this village (strictly within panchayatBooths)
      const vBooths = (() => {
        const map = new Map<string, any>();
        (village.booths || []).forEach((b: any) => {
          const matchInPanchayat = panchayatBooths.find(
            (pb: any) => pb.id === b.id || pb.boothNo === b.boothNo
          );
          if (matchInPanchayat) {
            map.set(matchInPanchayat.id || matchInPanchayat.boothNo, matchInPanchayat);
          }
        });
        vKilais.forEach((vk: any) => {
          (vk.booths || []).forEach((kb: any) => {
            const fullBooth = panchayatBooths.find(
              (pb: any) => pb.id === kb.id || pb.boothNo === kb.boothNo
            );
            if (fullBooth) {
              map.set(fullBooth.id || fullBooth.boothNo, fullBooth);
            }
          });
        });
        if (map.size === 0) {
          const vNameLow = village.name?.trim().toLowerCase();
          panchayatBooths.forEach((b: any) => {
            if (b.area && b.area.trim().toLowerCase() === vNameLow) {
              map.set(b.id || b.boothNo, b);
            }
          });
        }
        const rawVBooths = Array.from(map.values());
        return rawVBooths.sort((a: any, b: any) => {
          const numA = parseInt(String(a.boothNo || '').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(String(b.boothNo || '').replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
      })();

      const activePanchayatSlug = dbPanchayat?.code || createAreaSlug(dbPanchayat?.nameEn || dbPanchayat?.englishName || dbPanchayat?.name) || resolvedAreaParam;
      const activeVillageSlug = village.code || createAreaSlug(village.nameEn || village.englishName || village.name) || village.id;
      const villageDetailUrl = `/panchayats/${encodeURIComponent(activePanchayatSlug)}/villages/${encodeURIComponent(activeVillageSlug)}`;

      const displayName = locale === 'ta' && village.nameTa ? village.nameTa : village.name;
      const secondaryName =
        village.nameTa && locale !== 'ta'
          ? village.nameTa
          : locale === 'ta' && village.name && village.name !== village.nameTa
          ? village.name
          : null;

      return {
        ...village,
        vKilais,
        vBooths,
        villageDetailUrl,
        displayName,
        secondaryName,
      };
    });

    // Sort villages in ascending order by lowest booth number, tie-breaking by name
    return mapped.sort((a: any, b: any) => {
      const aMin = getMinBoothNo(a);
      const bMin = getMinBoothNo(b);
      if (aMin !== bMin) return aMin - bMin;
      return (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '');
    });
  }, [villages, panchayatKilais, panchayatBooths, union?.id, areaParam, locale]);

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

  if (isUnionLoading || isPanchayatLoading) {
    return (
      <div className="p-12 text-center text-gray-500 font-medium">
        {locale === 'ta' ? 'ஊராட்சி விவரங்களை ஏற்றுகிறது...' : 'Loading panchayat details...'}
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* 1. Top Navigation & Header */}
      <PanchayatHeader
        union={union}
        areaNameEn={areaNameEn}
        areaNameTa={areaNameTa}
        unitLabel={unitLabel}
        panchayatKilaisCount={panchayatKilais.length}
        locale={locale}
        onRegisterCadre={() => setIsCadreModalOpen(true)}
      />

      {/* 2. Quick Executive Stats */}
      <PanchayatStats
        kilaisCount={panchayatKilais.length}
        boothsCount={panchayatBooths.length}
        cadresCount={totalCadresCount}
        villagesCount={enrichedVillages.length || villages.length}
        geoData={geoData}
        unionId={union?.id}
        panchayatId={dbPanchayat?.id}
        locale={locale}
      />

      {/* 3. Villages & Hamlets Section */}
      <VillagesSection
        villages={enrichedVillages}
        areaNameEn={areaNameEn}
        areaNameTa={areaNameTa}
        locale={locale}
      />

      {/* 4. Kilais Section (Table & Tile View) */}
      <KilaisSection
        panchayatKilais={panchayatKilais}
        areaNameEn={areaNameEn}
        areaNameTa={areaNameTa}
        unionId={union?.id}
        panchayatId={dbPanchayat?.id}
        locale={locale}
      />

      {/* 5. Covered Polling Booths Section (Table & Tile View) */}
      <BoothsSection
        panchayatBooths={panchayatBooths}
        showAssignedKilai={true}
        areaNameEn={areaNameEn}
        areaNameTa={areaNameTa}
        unionId={union?.id}
        panchayatId={dbPanchayat?.id}
        locale={locale}
      />

      {/* 6. Interactive Field Map & Intelligence */}
      <PanchayatMapSection
        geoData={geoData}
        areaNameEn={areaNameEn}
        areaNameTa={areaNameTa}
        areaParam={areaParam}
        union={union}
        panchayatKilais={panchayatKilais}
        panchayatBooths={panchayatBooths}
        totalCadresCount={totalCadresCount}
        locale={locale}
        onSaveGeo={(geo) => {
          if (dbPanchayat?.id) {
            updateGeoMutation.mutate({
              id: dbPanchayat.id,
              geoData: {
                centerLat: geo.center[0],
                centerLng: geo.center[1],
                boundary: geo.boundaryCoords,
              },
            });
          }
        }}
      />

      {/* Cadre Registration Modal */}
      <CadreFormDialog
        isOpen={isCadreModalOpen}
        onOpenChange={setIsCadreModalOpen}
        editingId={null}
        defaultLevel="UNION"
        lockLevel={false}
        defaultUnionId={union?.id}
        defaultPanchayat={dbPanchayat?.name || areaParam}
        onSuccess={() => {
          if (union?.id) {
            queryClient.invalidateQueries({ queryKey: ['unions', union.id] });
          }
          queryClient.invalidateQueries({ queryKey: ['kilais'] });
        }}
      />

      {/* Direct Call Confirmation Dialog */}
      <CallConfirmationDialog
        person={callConfirmation}
        onOpenChange={(open) => !open && setCallConfirmation(null)}
      />
    </div>
  );
}
