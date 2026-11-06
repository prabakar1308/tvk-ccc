'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Building2,
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Building,
  Vote,
  Compass,
  ArrowUpDown,
  Filter,
  LayoutGrid,
  LayoutList,
  ChevronRight,
  Globe,
  Store,
  X,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Sparkles,
  Copy,
  ListPlus,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { translateAreaToTamil, getAreaGeoData } from '@/lib/area-translations';
import { useLocale } from 'next-intl';
import { useUser } from '@/contexts/user-context';
import { getOrgUnitName, getUnitTypeLabel } from '@/lib/org-unit-translations';
import {
  usePanchayats,
  useCreatePanchayat,
  useUpdatePanchayat,
  useDeletePanchayat,
} from '@/hooks/use-panchayats';
import {
  useVillages,
  useCreateVillage,
  useUpdateVillage,
  useDeleteVillage,
} from '@/hooks/use-villages';
import { useUnions } from '@/hooks/use-unions';
import { Panchayat, CreatePanchayatDto } from '@/services/api/panchayats';
import { Village, CreateVillageDto } from '@/services/api/villages';
import MapCoordinatePickerModal from '@/components/maps/map-coordinate-picker-modal';

export function MasterDataTab() {
  const locale = useLocale();
  const { user, activeUnionId } = useUser();
  const queryClient = useQueryClient();

  // Active sub-view: 'panchayats' | 'villages'
  const [subView, setSubView] = useState<'panchayats' | 'villages'>('panchayats');

  // View mode: 'table' | 'tiles' (Desktop defaults to table, mobile/tablet to tiles)
  const [viewMode, setViewMode] = useState<'table' | 'tiles'>('table');

  // Track if user has manually changed the union filter
  const [isUserInteracted, setIsUserInteracted] = useState<boolean>(false);

  // Filters
  const [selectedUnionId, setSelectedUnionId] = useState<string>('all');
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Detect screen size on mount: Table for desktop (>=1024px), Tile for others (<1024px)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 1024;
      setViewMode(isDesktop ? 'table' : 'tiles');
    }
  }, []);

  // Queries
  const { data: unions = [], isLoading: isLoadingUnions } = useUnions();

  const userRole = (user?.role || '').toUpperCase();
  const userLevel = (user?.level || user?.cadre?.level || '').toUpperCase();
  const scopeLevel = (user?.scopeLevel || user?.cadre?.role?.scopeLevel || '').toUpperCase();

  const isKilaiOrUnion = useMemo(() => {
    return (
      userLevel === 'UNION' ||
      userLevel === 'KILAI' ||
      userRole === 'UNION_LEADER' ||
      userRole === 'KILAI_LEADER' ||
      scopeLevel === 'UNION' ||
      scopeLevel === 'KILAI' ||
      Boolean(
        user?.unionId ||
        user?.cadre?.unionId ||
        user?.cadre?.homeKilai?.unionId ||
        (activeUnionId && userRole !== 'SUPER_ADMIN' && userRole !== 'DISTRICT_LEADER')
      )
    );
  }, [userLevel, userRole, scopeLevel, user?.unionId, user?.cadre, activeUnionId]);

  const personUnionId = useMemo(() => {
    return (
      user?.unionId ||
      user?.cadre?.unionId ||
      user?.cadre?.homeKilai?.unionId ||
      (isKilaiOrUnion ? activeUnionId : null)
    );
  }, [user?.unionId, user?.cadre, isKilaiOrUnion, activeUnionId]);

  // Default union selection:
  // If person belongs to Kilai/Union, the respective Org Unit is selected by default
  // If person belongs to District / Super Admin (or fallback), the first union is selected by default
  useEffect(() => {
    if (isUserInteracted) return;
    if (!unions || unions.length === 0) return;

    // Rule 1: If person belongs to Kilai/Union, the respective Org Unit should be selected by default
    if (isKilaiOrUnion && personUnionId) {
      const match = unions.find((u: any) => String(u.id) === String(personUnionId));
      if (match) {
        setSelectedUnionId(String(match.id));
        return;
      }
      setSelectedUnionId(String(personUnionId));
      return;
    }

    // Rule 2: If person belongs to District / Super Admin (or fallback), the first union should be selected by default
    if (unions.length > 0 && selectedUnionId === 'all') {
      setSelectedUnionId(String(unions[0].id));
    }
  }, [unions, isUserInteracted, isKilaiOrUnion, personUnionId, selectedUnionId]);

  const effectiveUnionId = selectedUnionId !== 'all' ? selectedUnionId : undefined;
  const { data: panchayats = [], isLoading: isLoadingPanchayats } = usePanchayats(effectiveUnionId);
  const { data: allPanchayats = [] } = usePanchayats();

  const effectivePanchayatId = selectedPanchayatId !== 'all' ? selectedPanchayatId : undefined;
  const { data: villages = [], isLoading: isLoadingVillages } = useVillages(effectivePanchayatId);

  // Mutations
  const createPanchayat = useCreatePanchayat();
  const updatePanchayat = useUpdatePanchayat();
  const deletePanchayat = useDeletePanchayat();

  const createVillage = useCreateVillage();
  const updateVillage = useUpdateVillage();
  const deleteVillage = useDeleteVillage();

  // Map Coordinate Picker Dialog State
  const [mapPickerState, setMapPickerState] = useState<{
    isOpen: boolean;
    target: 'panchayatForm' | 'villageForm' | 'quickPanchayat' | 'quickVillage';
    entityId?: string;
    title: string;
    subtitle?: string;
    lat?: number;
    lng?: number;
    entityType: 'panchayat' | 'village';
  }>({
    isOpen: false,
    target: 'panchayatForm',
    title: '',
    entityType: 'village',
  });

  // Dialog States - Panchayat
  const [isPanchayatDialogOpen, setIsPanchayatDialogOpen] = useState(false);
  const [editingPanchayat, setEditingPanchayat] = useState<Panchayat | null>(null);
  const [panchayatForm, setPanchayatForm] = useState<CreatePanchayatDto>({
    name: '',
    nameTa: '',
    unionId: '',
    type: 'VILLAGE_PANCHAYAT',
    wardNumber: undefined,
    centerLat: undefined,
    centerLng: undefined,
    description: '',
  });

  // Dialog States - Village
  const [isVillageDialogOpen, setIsVillageDialogOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [villageUnionFilter, setVillageUnionFilter] = useState<string>('');
  const [villageForm, setVillageForm] = useState<CreateVillageDto>({
    name: '',
    nameTa: '',
    panchayatId: '',
    centerLat: undefined,
    centerLng: undefined,
    description: '',
  });

  // Dialog States - Bulk Panchayat
  const [isBulkPanchayatDialogOpen, setIsBulkPanchayatDialogOpen] = useState(false);
  const [bulkPanchayatUnionId, setBulkPanchayatUnionId] = useState<string>('');
  const [bulkPanchayatMode, setBulkPanchayatMode] = useState<'rows' | 'paste'>('rows');
  const [bulkPanchayatPasteText, setBulkPanchayatPasteText] = useState('');
  const [bulkPanchayatRows, setBulkPanchayatRows] = useState<
    Array<{
      id: string;
      name: string;
      nameTa: string;
      type: 'VILLAGE_PANCHAYAT' | 'TOWN_PANCHAYAT_WARD' | 'MUNICIPALITY_WARD';
      wardNumber?: number;
    }>
  >([
    { id: 'bp-1', name: '', nameTa: '', type: 'VILLAGE_PANCHAYAT' },
    { id: 'bp-2', name: '', nameTa: '', type: 'VILLAGE_PANCHAYAT' },
    { id: 'bp-3', name: '', nameTa: '', type: 'VILLAGE_PANCHAYAT' },
  ]);
  const [bulkPanchayatSubmitting, setBulkPanchayatSubmitting] = useState(false);
  const [bulkPanchayatProgress, setBulkPanchayatProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  } | null>(null);
  const [bulkPanchayatResult, setBulkPanchayatResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Dialog States - Bulk Village
  const [isBulkVillageDialogOpen, setIsBulkVillageDialogOpen] = useState(false);
  const [bulkVillageUnionId, setBulkVillageUnionId] = useState<string>('');
  const [bulkVillagePanchayatId, setBulkVillagePanchayatId] = useState<string>('');
  const [bulkVillageMode, setBulkVillageMode] = useState<'rows' | 'paste'>('rows');
  const [bulkVillagePasteText, setBulkVillagePasteText] = useState('');
  const [bulkVillageRows, setBulkVillageRows] = useState<
    Array<{
      id: string;
      name: string;
      nameTa: string;
      centerLat?: number;
      centerLng?: number;
    }>
  >([
    { id: 'bv-1', name: '', nameTa: '' },
    { id: 'bv-2', name: '', nameTa: '' },
    { id: 'bv-3', name: '', nameTa: '' },
  ]);
  const [bulkVillageSubmitting, setBulkVillageSubmitting] = useState(false);
  const [bulkVillageProgress, setBulkVillageProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  } | null>(null);
  const [bulkVillageResult, setBulkVillageResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'panchayat' | 'village';
    id: string;
    name: string;
  } | null>(null);

  // Selected Union Display Name (Ensures dropdown shows full value, never raw ID)
  const selectedUnionObj = useMemo(() => {
    return unions.find((u: any) => u.id === selectedUnionId);
  }, [unions, selectedUnionId]);

  const selectedUnionDisplayName = useMemo(() => {
    if (selectedUnionId === 'all') {
      return locale === 'ta' ? '🌐 அனைத்து ஒன்றியங்கள்' : '🌐 All Unions';
    }
    if (selectedUnionObj) {
      const uTa = getOrgUnitName(selectedUnionObj, 'ta');
      return locale === 'ta' && uTa && uTa !== selectedUnionObj.name
        ? `${uTa} (${selectedUnionObj.name})`
        : getOrgUnitName(selectedUnionObj, locale);
    }
    return locale === 'ta' ? 'ஒன்றியத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Union';
  }, [selectedUnionId, selectedUnionObj, locale]);

  // Selected Panchayat Display Name (Ensures dropdown shows full value, never raw ID)
  const selectedPanchayatObj = useMemo(() => {
    return panchayats.find((p: any) => p.id === selectedPanchayatId);
  }, [panchayats, selectedPanchayatId]);

  const selectedPanchayatDisplayName = useMemo(() => {
    if (selectedPanchayatId === 'all') {
      return locale === 'ta' ? '🏛️ அனைத்து ஊராட்சிகள்' : '🏛️ All Panchayats';
    }
    if (selectedPanchayatObj) {
      return locale === 'ta' && selectedPanchayatObj.nameTa
        ? `${selectedPanchayatObj.nameTa} (${selectedPanchayatObj.name})`
        : selectedPanchayatObj.name;
    }
    return locale === 'ta' ? 'ஊராட்சியைத் தேர்ந்தெடுக்கவும்' : 'Select Panchayat';
  }, [selectedPanchayatId, selectedPanchayatObj, locale]);

  // Filtered Panchayats
  const filteredPanchayats = useMemo(() => {
    return panchayats.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.nameTa && p.nameTa.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.wardNumber && String(p.wardNumber).includes(q));
      return matchSearch;
    });
  }, [panchayats, searchQuery]);

  // Filtered Villages
  const filteredVillages = useMemo(() => {
    return villages.filter((v) => {
      // If a union filter is active and village has panchayat.unionId
      if (selectedUnionId !== 'all') {
        const pUnionId = v.panchayat?.unionId || panchayats.find((p) => p.id === v.panchayatId)?.unionId;
        if (pUnionId && pUnionId !== selectedUnionId) {
          return false;
        }
      }
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        (v.nameTa && v.nameTa.toLowerCase().includes(q)) ||
        (v.code && v.code.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [villages, panchayats, selectedUnionId, searchQuery]);

  // Total displaying metrics
  const totalDisplayedKilais = useMemo(() => {
    if (subView === 'panchayats') {
      return filteredPanchayats.reduce((sum, p) => sum + (p._count?.kilais ?? p.kilais?.length ?? 0), 0);
    }
    return filteredVillages.reduce((sum, v) => sum + (v._count?.kilais ?? v.kilais?.length ?? 0), 0);
  }, [subView, filteredPanchayats, filteredVillages]);

  const totalDisplayedBooths = useMemo(() => {
    if (subView === 'panchayats') {
      return filteredPanchayats.reduce((sum, p) => sum + (p._count?.booths ?? p.booths?.length ?? 0), 0);
    }
    return filteredVillages.reduce((sum, v) => sum + (v._count?.booths ?? v.booths?.length ?? 0), 0);
  }, [subView, filteredPanchayats, filteredVillages]);

  // Handle open create/edit panchayat
  const handleOpenPanchayatDialog = (panchayat?: Panchayat) => {
    if (panchayat) {
      setEditingPanchayat(panchayat);
      setPanchayatForm({
        name: panchayat.name,
        nameTa: panchayat.nameTa || panchayat.name,
        unionId: panchayat.unionId,
        type: panchayat.type || 'VILLAGE_PANCHAYAT',
        wardNumber: panchayat.wardNumber || undefined,
        centerLat: panchayat.centerLat ?? undefined,
        centerLng: panchayat.centerLng ?? undefined,
        description: panchayat.description || '',
      });
    } else {
      setEditingPanchayat(null);
      setPanchayatForm({
        name: '',
        nameTa: '',
        unionId: selectedUnionId !== 'all' ? selectedUnionId : (unions[0]?.id || ''),
        type: 'VILLAGE_PANCHAYAT',
        wardNumber: undefined,
        centerLat: undefined,
        centerLng: undefined,
        description: '',
      });
    }
    setIsPanchayatDialogOpen(true);
  };

  // Callback from Map Coordinate Picker Modal
  const handleConfirmMapPicker = async (lat: number, lng: number) => {
    if (mapPickerState.target === 'panchayatForm') {
      setPanchayatForm((prev) => ({
        ...prev,
        centerLat: lat,
        centerLng: lng,
      }));
    } else if (mapPickerState.target === 'villageForm') {
      setVillageForm((prev) => ({
        ...prev,
        centerLat: lat,
        centerLng: lng,
      }));
    } else if (mapPickerState.target === 'quickPanchayat' && mapPickerState.entityId) {
      try {
        await updatePanchayat.mutateAsync({
          id: mapPickerState.entityId,
          data: { centerLat: lat, centerLng: lng },
        });
      } catch (err) {
        console.error('Failed to update panchayat location:', err);
      }
    } else if (mapPickerState.target === 'quickVillage' && mapPickerState.entityId) {
      try {
        await updateVillage.mutateAsync({
          id: mapPickerState.entityId,
          data: { centerLat: lat, centerLng: lng },
        });
      } catch (err) {
        console.error('Failed to update village location:', err);
      }
    }
  };

  // Handle save panchayat
  const handleSavePanchayat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panchayatForm.name.trim() || !panchayatForm.unionId) {
      return;
    }

    try {
      if (editingPanchayat) {
        await updatePanchayat.mutateAsync({
          id: editingPanchayat.id,
          data: panchayatForm,
        });
      } else {
        await createPanchayat.mutateAsync(panchayatForm);
      }
      setIsPanchayatDialogOpen(false);
    } catch (err) {
      console.error('Failed to save panchayat:', err);
    }
  };

  // Handle open create/edit village
  const handleOpenVillageDialog = (village?: Village) => {
    if (village) {
      setEditingVillage(village);
      const parentPanchayat = panchayats.find((p) => p.id === village.panchayatId);
      setVillageUnionFilter(parentPanchayat?.unionId || '');
      setVillageForm({
        name: village.name,
        nameTa: village.nameTa || village.name,
        panchayatId: village.panchayatId,
        centerLat: village.centerLat || undefined,
        centerLng: village.centerLng || undefined,
        description: village.description || '',
      });
    } else {
      setEditingVillage(null);
      const defaultUnion = selectedUnionId !== 'all' ? selectedUnionId : (unions[0]?.id || '');
      setVillageUnionFilter(defaultUnion);
      const defaultPanchayat =
        selectedPanchayatId !== 'all'
          ? selectedPanchayatId
          : panchayats.find((p) => !defaultUnion || p.unionId === defaultUnion)?.id || '';
      setVillageForm({
        name: '',
        nameTa: '',
        panchayatId: defaultPanchayat,
        centerLat: undefined,
        centerLng: undefined,
        description: '',
      });
    }
    setIsVillageDialogOpen(true);
  };

  // Handle save village
  const handleSaveVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageForm.name.trim() || !villageForm.panchayatId) {
      return;
    }

    try {
      if (editingVillage) {
        await updateVillage.mutateAsync({
          id: editingVillage.id,
          data: villageForm,
        });
      } else {
        await createVillage.mutateAsync(villageForm);
      }
      setIsVillageDialogOpen(false);
    } catch (err) {
      console.error('Failed to save village:', err);
    }
  };


  // Open Bulk Panchayat Dialog
  const handleOpenBulkPanchayatDialog = (initialUnionId?: string) => {
    const targetUnion = initialUnionId || (selectedUnionId !== 'all' ? selectedUnionId : (unions[0]?.id || ''));
    setBulkPanchayatUnionId(targetUnion);
    setBulkPanchayatRows([
      { id: `bp-${Date.now()}-1`, name: '', nameTa: '', type: 'VILLAGE_PANCHAYAT' },
      { id: `bp-${Date.now()}-2`, name: '', nameTa: '', type: 'VILLAGE_PANCHAYAT' },
      { id: `bp-${Date.now()}-3`, name: '', nameTa: '', type: 'VILLAGE_PANCHAYAT' },
    ]);
    setBulkPanchayatPasteText('');
    setBulkPanchayatMode('rows');
    setBulkPanchayatProgress(null);
    setBulkPanchayatResult(null);
    setIsBulkPanchayatDialogOpen(true);
  };

  // Parse Bulk Panchayat pasted text
  const handleParseBulkPanchayatPaste = () => {
    if (!bulkPanchayatPasteText.trim()) return;
    const lines = bulkPanchayatPasteText.split('\n').map((l) => l.trim()).filter(Boolean);
    const newRows = lines.map((line, idx) => {
      const parts = line.split(/[-;\t]/).map((p) => p.trim());
      const enName = parts[0] || '';
      let taName = parts[1] || '';
      if (!taName && enName) {
        const autoTa = translateAreaToTamil(enName);
        if (autoTa && autoTa.toLowerCase() !== enName.toLowerCase()) {
          taName = autoTa;
        }
      }
      const wardNum = parts[2] && !isNaN(Number(parts[2])) ? Number(parts[2]) : undefined;
      return {
        id: `bp-${Date.now()}-${idx}`,
        name: enName,
        nameTa: taName || enName,
        type: (wardNum ? 'TOWN_PANCHAYAT_WARD' : 'VILLAGE_PANCHAYAT') as 'VILLAGE_PANCHAYAT' | 'TOWN_PANCHAYAT_WARD' | 'MUNICIPALITY_WARD',
        wardNumber: wardNum,
      };
    });
    setBulkPanchayatRows((prev) => {
      const existingValid = prev.filter((r) => r.name.trim().length > 0);
      return [...existingValid, ...newRows];
    });
    setBulkPanchayatPasteText('');
    setBulkPanchayatMode('rows');
  };

  // Save Bulk Panchayats
  const handleSaveBulkPanchayats = async () => {
    if (!bulkPanchayatUnionId) {
      alert(locale === 'ta' ? 'தயவுசெய்து ஒன்றியத்தைத் தேர்ந்தெடுக்கவும்' : 'Please select a Union');
      return;
    }
    const validRows = bulkPanchayatRows.filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) {
      alert(locale === 'ta' ? 'குறைந்தது ஒரு ஊராட்சியின் பெயரை உள்ளிடவும்' : 'Please enter at least one Panchayat name');
      return;
    }

    setBulkPanchayatSubmitting(true);
    setBulkPanchayatResult(null);
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setBulkPanchayatProgress({
        current: i + 1,
        total: validRows.length,
        currentName: row.name,
      });
      try {
        await createPanchayat.mutateAsync({
          name: row.name.trim(),
          nameTa: row.nameTa.trim() || row.name.trim(),
          unionId: bulkPanchayatUnionId,
          type: row.type || 'VILLAGE_PANCHAYAT',
          wardNumber: row.wardNumber || undefined,
        });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to add panchayat ${row.name}:`, err);
        failedCount++;
        errors.push(`${row.name}: ${err?.message || 'Failed'}`);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['panchayats'] });
    queryClient.invalidateQueries({ queryKey: ['unions'] });

    setBulkPanchayatSubmitting(false);
    setBulkPanchayatProgress(null);
    setBulkPanchayatResult({ success: successCount, failed: failedCount, errors });

    if (failedCount === 0) {
      setTimeout(() => {
        setIsBulkPanchayatDialogOpen(false);
        setBulkPanchayatResult(null);
      }, 1500);
    }
  };

  // Open Bulk Village Dialog
  const handleOpenBulkVillageDialog = (initialUnionId?: string, initialPanchayatId?: string) => {
    const targetUnion = initialUnionId || (selectedUnionId !== 'all' ? selectedUnionId : (unions[0]?.id || ''));
    setBulkVillageUnionId(targetUnion);

    const availablePanchayats = allPanchayats.length > 0 ? allPanchayats : panchayats;
    const matchingPanchayats = availablePanchayats.filter((p) => !targetUnion || p.unionId === targetUnion);
    const targetPanchayat =
      initialPanchayatId ||
      (selectedPanchayatId !== 'all'
        ? selectedPanchayatId
        : (matchingPanchayats[0]?.id || ''));
    setBulkVillagePanchayatId(targetPanchayat);

    setBulkVillageRows([
      { id: `bv-${Date.now()}-1`, name: '', nameTa: '' },
      { id: `bv-${Date.now()}-2`, name: '', nameTa: '' },
      { id: `bv-${Date.now()}-3`, name: '', nameTa: '' },
    ]);
    setBulkVillagePasteText('');
    setBulkVillageMode('rows');
    setBulkVillageProgress(null);
    setBulkVillageResult(null);
    setIsBulkVillageDialogOpen(true);
  };

  // Parse Bulk Village pasted text
  const handleParseBulkVillagePaste = () => {
    if (!bulkVillagePasteText.trim()) return;
    const lines = bulkVillagePasteText.split('\n').map((l) => l.trim()).filter(Boolean);
    const newRows = lines.map((line, idx) => {
      const parts = line.split(/[-;\t]/).map((p) => p.trim());
      const enName = parts[0] || '';
      let taName = parts[1] || '';
      if (!taName && enName) {
        const autoTa = translateAreaToTamil(enName);
        if (autoTa && autoTa.toLowerCase() !== enName.toLowerCase()) {
          taName = autoTa;
        }
      }
      let lat: number | undefined = undefined;
      let lng: number | undefined = undefined;
      if (parts[2] && !isNaN(Number(parts[2])) && parts[3] && !isNaN(Number(parts[3]))) {
        lat = Number(parts[2]);
        lng = Number(parts[3]);
      } else {
        const geo = getAreaGeoData(enName);
        if (geo && geo.center) {
          lat = geo.center[0];
          lng = geo.center[1];
        }
      }
      return {
        id: `bv-${Date.now()}-${idx}`,
        name: enName,
        nameTa: taName || enName,
        centerLat: lat,
        centerLng: lng,
      };
    });
    setBulkVillageRows((prev) => {
      const existingValid = prev.filter((r) => r.name.trim().length > 0);
      return [...existingValid, ...newRows];
    });
    setBulkVillagePasteText('');
    setBulkVillageMode('rows');
  };

  // Save Bulk Villages
  const handleSaveBulkVillages = async () => {
    if (!bulkVillagePanchayatId) {
      alert(locale === 'ta' ? 'தயவுசெய்து தாய் ஊராட்சியைத் தேர்ந்தெடுக்கவும்' : 'Please select a Parent Panchayat');
      return;
    }
    const validRows = bulkVillageRows.filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) {
      alert(locale === 'ta' ? 'குறைந்தது ஒரு கிராமத்தின் பெயரை உள்ளிடவும்' : 'Please enter at least one Village name');
      return;
    }

    setBulkVillageSubmitting(true);
    setBulkVillageResult(null);
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setBulkVillageProgress({
        current: i + 1,
        total: validRows.length,
        currentName: row.name,
      });
      try {
        await createVillage.mutateAsync({
          name: row.name.trim(),
          nameTa: row.nameTa.trim() || row.name.trim(),
          panchayatId: bulkVillagePanchayatId,
          centerLat: row.centerLat,
          centerLng: row.centerLng,
        });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to add village ${row.name}:`, err);
        failedCount++;
        errors.push(`${row.name}: ${err?.message || 'Failed'}`);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['villages'] });
    queryClient.invalidateQueries({ queryKey: ['panchayats'] });

    setBulkVillageSubmitting(false);
    setBulkVillageProgress(null);
    setBulkVillageResult({ success: successCount, failed: failedCount, errors });

    if (failedCount === 0) {
      setTimeout(() => {
        setIsBulkVillageDialogOpen(false);
        setBulkVillageResult(null);
      }, 1500);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'panchayat') {
        await deletePanchayat.mutateAsync(deleteTarget.id);
      } else {
        await deleteVillage.mutateAsync(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Panchayats available for village form dialog dropdown
  const dialogPanchayats = useMemo(() => {
    const list = allPanchayats.length > 0 ? allPanchayats : panchayats;
    if (!villageUnionFilter) return list;
    return list.filter((p) => p.unionId === villageUnionFilter);
  }, [allPanchayats, panchayats, villageUnionFilter]);

  // Panchayats available for bulk village dialog dropdown
  const bulkVillageAvailablePanchayats = useMemo(() => {
    const list = allPanchayats.length > 0 ? allPanchayats : panchayats;
    if (!bulkVillageUnionId) return list;
    return list.filter((p) => p.unionId === bulkVillageUnionId);
  }, [allPanchayats, panchayats, bulkVillageUnionId]);

  // Helper for Territory Type badge with larger, comfortable typography
  const renderTypeBadge = (type: string) => {
    if (type === 'TOWN_PANCHAYAT_WARD') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Store className="w-3.5 h-3.5" />
          <span>{locale === 'ta' ? 'பேரூராட்சி வார்டு' : 'Town Ward'}</span>
        </span>
      );
    }
    if (type === 'MUNICIPALITY_WARD') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <Building2 className="w-3.5 h-3.5" />
          <span>{locale === 'ta' ? 'நகராட்சி வார்டு' : 'Municipality Ward'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <Building className="w-3.5 h-3.5" />
        <span>{locale === 'ta' ? 'கிராம ஊராட்சி' : 'Village Panchayat'}</span>
      </span>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      {/* 1. Overview Banner Card */}
      <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-gradient-to-br from-white via-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950">
        <CardHeader className="bg-gradient-to-r from-[#8F0A1B]/10 via-[#FFC72C]/10 to-transparent border-b border-zinc-100 dark:border-zinc-800 p-4 sm:p-5 md:p-6 pb-4 sm:pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#8F0A1B] to-[#B81930] text-white flex items-center justify-center shadow-xs shrink-0">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFC72C]" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white leading-tight">
                  <span className="truncate">{locale === 'ta' ? 'பிரதேச முதன்மை தரவு மேலாண்மை' : 'Territory Master Data Management'}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm md:text-base mt-0.5 text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {locale === 'ta'
                    ? 'ஊராட்சிகள், வார்டுகள் மற்றும் கிராமங்கள் / குடியிருப்புகளை நிர்வகிக்கவும்'
                    : 'Manage Panchayats, Wards, and Village/Hamlet boundaries across all administrative units'}
                </CardDescription>
              </div>
            </div>

            {/* Sub-View Switcher Pills */}
            <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setSubView('panchayats')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm md:text-base font-bold transition-all cursor-pointer ${
                  subView === 'panchayats'
                    ? 'bg-gradient-to-r from-[#8F0A1B] to-[#B81930] text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">{locale === 'ta' ? 'ஊராட்சிகள்' : 'Panchayats'}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold ${
                  subView === 'panchayats' ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                }`}>
                  {panchayats.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubView('villages')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm md:text-base font-bold transition-all cursor-pointer ${
                  subView === 'villages'
                    ? 'bg-gradient-to-r from-[#8F0A1B] to-[#B81930] text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">{locale === 'ta' ? 'கிராமங்கள்' : 'Villages'}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold ${
                  subView === 'villages' ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                }`}>
                  {villages.length}
                </span>
              </button>
            </div>
          </div>
        </CardHeader>

        {/* 2. Filter and Action Bar */}
        <CardContent className="p-3.5 sm:p-5 md:p-6 space-y-3.5 sm:space-y-4">
          {/* Row 1: Search & Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 items-center">
            {/* Search Input */}
            <div className={`relative ${subView === 'villages' ? 'sm:col-span-2 lg:col-span-4' : 'sm:col-span-2 lg:col-span-6'}`}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  subView === 'panchayats'
                    ? (locale === 'ta' ? 'ஊராட்சி / வார்டைத் தேடுங்கள்...' : 'Search panchayat or ward...')
                    : (locale === 'ta' ? 'கிராமத்தைத் தேடுங்கள்...' : 'Search village or hamlet...')
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-sm sm:text-base shadow-xs w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Union Filter Dropdown */}
            <div className={`${subView === 'villages' ? 'sm:col-span-1 lg:col-span-4' : 'sm:col-span-2 lg:col-span-6'}`}>
              <Select
                value={selectedUnionId}
                onValueChange={(val) => {
                  setIsUserInteracted(true);
                  const uId = val || 'all';
                  setSelectedUnionId(uId);
                  setSelectedPanchayatId('all');
                }}
              >
                <SelectTrigger className="h-11 px-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-sm sm:text-base font-semibold shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors focus:ring-2 focus:ring-[#8F0A1B]/15 text-left w-full">
                  <div className="flex items-center gap-2.5 truncate w-full">
                    <Building2 className="w-4.5 h-4.5 shrink-0 text-[#8F0A1B]" />
                    <SelectValue placeholder={locale === 'ta' ? 'அனைத்து ஒன்றியங்கள்' : 'All Unions'}>
                      <span className="truncate">{selectedUnionDisplayName}</span>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[340px] rounded-xl shadow-lg border-zinc-200 dark:border-zinc-800 text-sm">
                  <SelectItem value="all" className="text-sm font-medium py-2.5">
                    {locale === 'ta' ? '🌐 அனைத்து ஒன்றியங்கள்' : '🌐 All Unions'}
                  </SelectItem>
                  {unions.map((u: any) => {
                    const uTa = getOrgUnitName(u, 'ta');
                    const uLabel = locale === 'ta' && uTa && uTa !== u.name ? `${uTa} (${u.name})` : getOrgUnitName(u, locale);
                    return (
                      <SelectItem key={u.id} value={u.id} className="text-sm font-medium py-2.5">
                        {uLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Panchayat Filter Dropdown (Only for Villages sub-view) */}
            {subView === 'villages' && (
              <div className="sm:col-span-1 lg:col-span-4">
                <Select
                  value={selectedPanchayatId}
                  onValueChange={(val) => setSelectedPanchayatId(val || 'all')}
                >
                  <SelectTrigger className="h-11 px-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-sm sm:text-base font-semibold shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors focus:ring-2 focus:ring-[#8F0A1B]/15 text-left w-full">
                    <div className="flex items-center gap-2.5 truncate w-full">
                      <MapPin className="w-4.5 h-4.5 shrink-0 text-[#8F0A1B]" />
                      <SelectValue placeholder={locale === 'ta' ? 'அனைத்து ஊராட்சிகள்' : 'All Panchayats'}>
                        <span className="truncate">{selectedPanchayatDisplayName}</span>
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[340px] rounded-xl shadow-lg border-zinc-200 dark:border-zinc-800 text-sm">
                    <SelectItem value="all" className="text-sm font-medium py-2.5">
                      {locale === 'ta' ? '🏛️ அனைத்து ஊராட்சிகள்' : '🏛️ All Panchayats'}
                    </SelectItem>
                    {panchayats.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-sm font-medium py-2.5">
                        {locale === 'ta' && p.nameTa ? `${p.nameTa} (${p.name})` : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Row 2: Action Controls (View Mode Toggle & Add Action Buttons) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {/* View Switcher: Table vs Tiles */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/60 self-start sm:self-auto shrink-0 shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('table')}
                className={`h-9 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                title={locale === 'ta' ? 'அட்டவணைப் பார்வை' : 'Table View (Desktop default)'}
              >
                <LayoutList className="w-4 h-4 mr-1.5" />
                <span>{locale === 'ta' ? 'அட்டவணை' : 'Table'}</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('tiles')}
                className={`h-9 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  viewMode === 'tiles'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                title={locale === 'ta' ? 'அட்டைப் பார்வை' : 'Tile View (Mobile default)'}
              >
                <LayoutGrid className="w-4 h-4 mr-1.5" />
                <span>{locale === 'ta' ? 'அட்டைகள்' : 'Tiles'}</span>
              </Button>
            </div>

            {/* Add New Action Buttons */}
            {subView === 'panchayats' ? (
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => handleOpenPanchayatDialog()}
                  className="bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white font-bold h-10 sm:h-11 px-3 sm:px-4.5 rounded-xl shadow-xs transition-transform active:scale-95 text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 cursor-pointer truncate"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="truncate">{locale === 'ta' ? 'புதிய ஊராட்சி' : 'Add Panchayat'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenBulkPanchayatDialog()}
                  className="border-[#8F0A1B] text-[#8F0A1B] dark:border-[#FFC72C] dark:text-[#FFC72C] hover:bg-[#8F0A1B]/10 font-bold h-10 sm:h-11 px-3 sm:px-4 rounded-xl shadow-xs transition-transform active:scale-95 text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 cursor-pointer truncate"
                  title={locale === 'ta' ? 'ஒரே நேரத்தில் பல ஊராட்சிகள் சேர்க்க' : 'Add Multiple Panchayats at once'}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span className="truncate">{locale === 'ta' ? 'பல சேர்க்க' : 'Add Multiple'}</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => handleOpenVillageDialog()}
                  className="bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white font-bold h-10 sm:h-11 px-3 sm:px-4.5 rounded-xl shadow-xs transition-transform active:scale-95 text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 cursor-pointer truncate"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="truncate">{locale === 'ta' ? 'புதிய கிராமம்' : 'Add Village'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenBulkVillageDialog()}
                  className="border-[#8F0A1B] text-[#8F0A1B] dark:border-[#FFC72C] dark:text-[#FFC72C] hover:bg-[#8F0A1B]/10 font-bold h-10 sm:h-11 px-3 sm:px-4 rounded-xl shadow-xs transition-transform active:scale-95 text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 cursor-pointer truncate"
                  title={locale === 'ta' ? 'ஒரே நேரத்தில் பல கிராமங்கள் சேர்க்க' : 'Add Multiple Villages at once'}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span className="truncate">{locale === 'ta' ? 'பல சேர்க்க' : 'Add Multiple'}</span>
                </Button>
              </div>
            )}
          </div>

          {/* 3. Status & Total Displaying Count Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 text-sm sm:text-base">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {locale === 'ta' ? 'காட்டப்படும் எண்ணிக்கை:' : 'Showing:'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8F0A1B]/10 text-[#8F0A1B] dark:bg-[#8F0A1B]/20 dark:text-[#FFC72C] font-extrabold font-mono text-sm sm:text-base border border-[#8F0A1B]/20">
                {subView === 'panchayats' ? filteredPanchayats.length : filteredVillages.length}
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                  / {subView === 'panchayats' ? panchayats.length : villages.length}{' '}
                  {subView === 'panchayats'
                    ? (locale === 'ta' ? 'ஊராட்சிகள்' : 'Panchayats')
                    : (locale === 'ta' ? 'கிராமங்கள்' : 'Villages')}
                </span>
              </span>

              {selectedUnionId !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-[#8F0A1B]" />
                  <span className="truncate max-w-[180px]">{selectedUnionDisplayName}</span>
                </span>
              )}

              {subView === 'villages' && selectedPanchayatId !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-[#8F0A1B]" />
                  <span className="truncate max-w-[180px]">{selectedPanchayatDisplayName}</span>
                </span>
              )}
            </div>

            {/* Quick Aggregate Stats on Display */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="inline-flex items-center gap-1.5 sm:gap-2">
                <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#8F0A1B] shrink-0"></span>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100 font-mono text-sm sm:text-base">{totalDisplayedKilais}</span>{' '}
                <span>{locale === 'ta' ? 'கிளைகள்' : 'Kilais'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 sm:gap-2">
                <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#FFC72C] shrink-0"></span>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100 font-mono text-sm sm:text-base">{totalDisplayedBooths}</span>{' '}
                <span>{locale === 'ta' ? 'சாவடிகள்' : 'Booths'}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 1: PANCHAYATS & WARDS */}
      {/* ========================================================================= */}
      {subView === 'panchayats' && (
        <>
          {isLoadingPanchayats ? (
            <Card className="p-14 text-center text-muted-foreground border-zinc-200/80 dark:border-zinc-800">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                  {locale === 'ta' ? 'ஊராட்சிகள் ஏற்றப்படுகின்றன...' : 'Loading Panchayats & Wards...'}
                </span>
              </div>
            </Card>
          ) : filteredPanchayats.length === 0 ? (
            <Card className="p-14 text-center text-muted-foreground border-zinc-200/80 dark:border-zinc-800">
              <div className="flex flex-col items-center justify-center gap-3">
                <Building className="w-14 h-14 text-muted-foreground/30" />
                <span className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
                  {locale === 'ta' ? 'ஊராட்சிகள் எதுவும் கிடைக்கவில்லை' : 'No Panchayats or Wards found'}
                </span>
                <span className="text-sm max-w-md text-zinc-500">
                  {locale === 'ta'
                    ? 'வடிகட்டிகளை மாற்றவும் அல்லது புதிய ஊராட்சி ஒன்றை உருவாக்கவும்.'
                    : 'Try clearing the search query, selecting another union, or adding a new record.'}
                </span>
              </div>
            </Card>
          ) : viewMode === 'table' ? (
            /* Table View (Desktop Default) */
            <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm sm:text-base">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 uppercase text-xs sm:text-sm font-bold tracking-wider">
                      <th className="py-4 px-4">{locale === 'ta' ? 'பெயர் / தமிழ் பெயர்' : 'Name / Tamil'}</th>
                      <th className="py-4 px-4">{locale === 'ta' ? 'வகை' : 'Territory Type'}</th>
                      <th className="py-4 px-4">{locale === 'ta' ? 'ஒன்றியம் / பகுதி' : 'Union / Unit'}</th>
                      <th className="py-4 px-4 text-center">{locale === 'ta' ? 'வார்டு எண்' : 'Ward No'}</th>
                      <th className="py-4 px-4 text-center">{locale === 'ta' ? 'கிராமங்கள்' : 'Villages'}</th>
                      <th className="py-4 px-4 text-center">{locale === 'ta' ? 'கிளைகள்' : 'Kilais'}</th>
                      <th className="py-4 px-4 text-center">{locale === 'ta' ? 'வாக்குச்சாவடிகள்' : 'Booths'}</th>
                      <th className="py-4 px-4 text-right">{locale === 'ta' ? 'செயல்கள்' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredPanchayats.map((p) => {
                      const parentUnion = p.union || unions.find((u: any) => u.id === p.unionId);
                      const unionName = parentUnion ? getOrgUnitName(parentUnion, locale) : '-';

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                        >
                          <td className="py-4 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8F0A1B] to-[#B81930] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Building className="w-5 h-5 text-[#FFC72C]" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-[#8F0A1B] transition-colors">
                                  {p.name}
                                </span>
                                {p.nameTa && p.nameTa !== p.name && (
                                  <span className="text-sm sm:text-base text-[#8F0A1B] dark:text-[#FFC72C] font-semibold mt-0.5">
                                    {p.nameTa}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">{renderTypeBadge(p.type)}</td>
                          <td className="py-4 px-4 text-zinc-700 dark:text-zinc-300 font-semibold text-sm sm:text-base">
                            {unionName}
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                            {p.wardNumber !== undefined && p.wardNumber !== null ? (
                              <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs sm:text-sm font-bold border border-zinc-200 dark:border-zinc-700">
                                Ward {p.wardNumber}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-normal">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPanchayatId(p.id);
                                setSubView('villages');
                              }}
                              className="inline-flex items-center justify-center min-w-[36px] h-7 px-3 rounded-full font-mono text-sm font-bold bg-[#8F0A1B]/10 hover:bg-[#8F0A1B]/20 text-[#8F0A1B] dark:text-[#FFC72C] cursor-pointer transition-colors border border-[#8F0A1B]/20"
                              title="Filter villages under this panchayat"
                            >
                              {p._count?.villages ?? p.villages?.length ?? 0}
                            </button>
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200">
                            {p._count?.kilais ?? p.kilais?.length ?? 0}
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200">
                            {p._count?.booths ?? p.booths?.length ?? 0}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setMapPickerState({
                                    isOpen: true,
                                    target: 'quickPanchayat',
                                    entityId: p.id,
                                    title: locale === 'ta' && p.nameTa ? `${p.nameTa} (${p.name})` : p.name,
                                    subtitle: unionName ? `${unionName}` : undefined,
                                    lat: p.centerLat || undefined,
                                    lng: p.centerLng || undefined,
                                    entityType: 'panchayat',
                                  });
                                }}
                                className={`h-9 w-9 rounded-xl cursor-pointer ${
                                  p.centerLat && p.centerLng
                                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                    : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                }`}
                                title={
                                  p.centerLat && p.centerLng
                                    ? `${locale === 'ta' ? 'அமைவிடம்' : 'Location'}: ${p.centerLat.toFixed(4)}, ${p.centerLng.toFixed(4)}`
                                    : (locale === 'ta' ? 'வரைபடத்தில் அமைவிடத்தை அமை' : 'Set Location on Map')
                                }
                              >
                                <MapPin className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenPanchayatDialog(p)}
                                className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-primary cursor-pointer"
                                title={locale === 'ta' ? 'திருத்து' : 'Edit'}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'panchayat',
                                    id: p.id,
                                    name: `${p.name} (${p.nameTa || ''})`,
                                  })
                                }
                                className="h-9 w-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-500 hover:text-red-600 cursor-pointer"
                                title={locale === 'ta' ? 'நீக்கு' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* Tile View (Mobile / Tablet Default & Switchable) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
              {filteredPanchayats.map((p) => {
                const parentUnion = p.union || unions.find((u: any) => u.id === p.unionId);
                const unionName = parentUnion ? getOrgUnitName(parentUnion, locale) : '-';

                return (
                  <div
                    key={p.id}
                    className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 hover:shadow-md hover:border-[#8F0A1B]/30 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Type & Ward badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {renderTypeBadge(p.type)}
                        <div className="flex items-center gap-1.5">
                          {p.wardNumber !== undefined && p.wardNumber !== null && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                              Ward {p.wardNumber}
                            </span>
                          )}
                          {p.centerLat && p.centerLng ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              title={`${p.centerLat.toFixed(4)}, ${p.centerLng.toFixed(4)}`}
                            >
                              <Globe className="w-3 h-3 text-emerald-600" />
                              GPS
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">No GPS</span>
                          )}
                        </div>
                      </div>

                      {/* Header Avatar & Name */}
                      <div className="flex items-start gap-3.5 mb-3.5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8F0A1B] to-[#B81930] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          <Building className="w-5.5 h-5.5 text-[#FFC72C]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#8F0A1B] transition-colors"
                            title={p.name}
                          >
                            {p.name}
                          </h3>
                          {p.nameTa && p.nameTa !== p.name && (
                            <p className="text-sm sm:text-base text-[#8F0A1B] dark:text-[#FFC72C] font-semibold truncate mt-0.5">
                              {p.nameTa}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Org Unit info */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3.5 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <Building2 className="w-4 h-4 shrink-0 text-zinc-500" />
                        <span className="truncate">{unionName}</span>
                      </div>

                      {/* 3-Column Metrics Row with larger bold figures */}
                      <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-center mb-3.5">
                        <div>
                          <div className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                            {p._count?.villages ?? p.villages?.length ?? 0}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">
                            {locale === 'ta' ? 'கிராமங்கள்' : 'Villages'}
                          </div>
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                            {p._count?.kilais ?? p.kilais?.length ?? 0}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">
                            {locale === 'ta' ? 'கிளைகள்' : 'Kilais'}
                          </div>
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                            {p._count?.booths ?? p.booths?.length ?? 0}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">
                            {locale === 'ta' ? 'சாவடிகள்' : 'Booths'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPanchayatId(p.id);
                          setSubView('villages');
                        }}
                        className="h-9 px-2.5 text-xs sm:text-sm font-bold text-[#8F0A1B] dark:text-[#FFC72C] hover:bg-[#8F0A1B]/10 rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{locale === 'ta' ? 'கிராமங்களைக் காண்க' : 'View Villages'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setMapPickerState({
                              isOpen: true,
                              target: 'quickPanchayat',
                              entityId: p.id,
                              title: locale === 'ta' && p.nameTa ? `${p.nameTa} (${p.name})` : p.name,
                              subtitle: unionName ? `${unionName}` : undefined,
                              lat: p.centerLat || undefined,
                              lng: p.centerLng || undefined,
                              entityType: 'panchayat',
                            });
                          }}
                          className={`h-9 w-9 rounded-xl cursor-pointer ${
                            p.centerLat && p.centerLng
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          }`}
                          title={
                            p.centerLat && p.centerLng
                              ? `${locale === 'ta' ? 'அமைவிடம்' : 'Location'}: ${p.centerLat.toFixed(4)}, ${p.centerLng.toFixed(4)}`
                              : (locale === 'ta' ? 'வரைபடத்தில் அமைவிடத்தை அமை' : 'Set Location on Map')
                          }
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenPanchayatDialog(p)}
                          className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 hover:text-primary cursor-pointer"
                          title={locale === 'ta' ? 'திருத்து' : 'Edit'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'panchayat',
                              id: p.id,
                              name: `${p.name} (${p.nameTa || ''})`,
                            })
                          }
                          className="h-9 w-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-500 hover:text-red-600 cursor-pointer"
                          title={locale === 'ta' ? 'நீக்கு' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: VILLAGES & HAMLETS */}
      {/* ========================================================================= */}
      {subView === 'villages' && (
        <>
          {isLoadingVillages ? (
            <Card className="p-14 text-center text-muted-foreground border-zinc-200/80 dark:border-zinc-800">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                  {locale === 'ta' ? 'கிராமங்கள் ஏற்றப்படுகின்றன...' : 'Loading Villages & Hamlets...'}
                </span>
              </div>
            </Card>
          ) : filteredVillages.length === 0 ? (
            <Card className="p-14 text-center text-muted-foreground border-zinc-200/80 dark:border-zinc-800">
              <div className="flex flex-col items-center justify-center gap-3">
                <MapPin className="w-14 h-14 text-muted-foreground/30" />
                <span className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
                  {locale === 'ta' ? 'கிராமங்கள் எதுவும் கிடைக்கவில்லை' : 'No Villages or Hamlets found'}
                </span>
                <span className="text-sm max-w-md text-zinc-500">
                  {locale === 'ta'
                    ? 'வடிகட்டிகளை மாற்றவும் அல்லது புதிய கிராமம் ஒன்றை உருவாக்கவும்.'
                    : 'Try selecting a different panchayat, clearing search, or adding a new village.'}
                </span>
              </div>
            </Card>
          ) : viewMode === 'table' ? (
            /* Table View (Desktop Default) */
            <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm sm:text-base">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 uppercase text-xs sm:text-sm font-bold tracking-wider">
                      <th className="py-4 px-4">{locale === 'ta' ? 'கிராமம் / குடியிருப்பு பெயர்' : 'Village / Hamlet'}</th>
                      <th className="py-4 px-4">{locale === 'ta' ? 'தாய் ஊராட்சி / வார்டு' : 'Parent Panchayat / Ward'}</th>
                      <th className="py-4 px-4">{locale === 'ta' ? 'ஒன்றியம்' : 'Union'}</th>
                      <th className="py-4 px-4 text-center">{locale === 'ta' ? 'புவியியல் அமைவிடம்' : 'GPS Coordinates'}</th>
                      <th className="py-4 px-4 text-center">{locale === 'ta' ? 'கிளைகள்' : 'Kilais'}</th>
                      <th className="py-4 px-4 text-center">{locale === 'ta' ? 'வாக்குச்சாவடிகள்' : 'Booths'}</th>
                      <th className="py-4 px-4 text-right">{locale === 'ta' ? 'செயல்கள்' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredVillages.map((v) => {
                      const parentPanchayat = v.panchayat || panchayats.find((p) => p.id === v.panchayatId);
                      const parentUnion = parentPanchayat?.union || unions.find((u: any) => u.id === parentPanchayat?.unionId);
                      const unionName = parentUnion ? getOrgUnitName(parentUnion, locale) : '-';

                      return (
                        <tr
                          key={v.id}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                        >
                          <td className="py-4 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8F0A1B] to-[#B81930] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <MapPin className="w-5 h-5 text-[#FFC72C]" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-[#8F0A1B] transition-colors">
                                  {v.name}
                                </span>
                                {v.nameTa && v.nameTa !== v.name && (
                                  <span className="text-sm sm:text-base text-[#8F0A1B] dark:text-[#FFC72C] font-semibold mt-0.5">
                                    {v.nameTa}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                if (parentPanchayat?.id) setSelectedPanchayatId(parentPanchayat.id);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                              title="Filter by this panchayat"
                            >
                              <Building className="w-3.5 h-3.5 text-[#8F0A1B] shrink-0" />
                              <span className="font-bold">{parentPanchayat?.name || '-'}</span>
                              {parentPanchayat?.nameTa && (
                                <span className="text-zinc-600 dark:text-zinc-400 font-medium text-xs">
                                  ({parentPanchayat.nameTa})
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-4 text-zinc-700 dark:text-zinc-300 font-semibold text-sm sm:text-base">
                            {unionName}
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-xs sm:text-sm">
                            {v.centerLat && v.centerLng ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs sm:text-sm">
                                <Compass className="w-3.5 h-3.5 shrink-0" />
                                {v.centerLat.toFixed(3)}°, {v.centerLng.toFixed(3)}°
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200">
                            {v._count?.kilais ?? v.kilais?.length ?? 0}
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200">
                            {v._count?.booths ?? v.booths?.length ?? 0}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setMapPickerState({
                                    isOpen: true,
                                    target: 'quickVillage',
                                    entityId: v.id,
                                    title: locale === 'ta' && v.nameTa ? `${v.nameTa} (${v.name})` : v.name,
                                    subtitle: parentPanchayat ? `${parentPanchayat.name} • ${unionName}` : undefined,
                                    lat: v.centerLat || parentPanchayat?.centerLat || undefined,
                                    lng: v.centerLng || parentPanchayat?.centerLng || undefined,
                                    entityType: 'village',
                                  });
                                }}
                                className={`h-9 w-9 rounded-xl cursor-pointer ${
                                  v.centerLat && v.centerLng
                                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                    : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                }`}
                                title={
                                  v.centerLat && v.centerLng
                                    ? `${locale === 'ta' ? 'அமைவிடம்' : 'Location'}: ${v.centerLat.toFixed(4)}, ${v.centerLng.toFixed(4)}`
                                    : (locale === 'ta' ? 'வரைபடத்தில் அமைவிடத்தை அமை' : 'Set Location on Map')
                                }
                              >
                                <MapPin className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenVillageDialog(v)}
                                className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-primary cursor-pointer"
                                title={locale === 'ta' ? 'திருத்து' : 'Edit'}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'village',
                                    id: v.id,
                                    name: `${v.name} (${v.nameTa || ''})`,
                                  })
                                }
                                className="h-9 w-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-500 hover:text-red-600 cursor-pointer"
                                title={locale === 'ta' ? 'நீக்கு' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* Tile View (Mobile / Tablet Default & Switchable) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
              {filteredVillages.map((v) => {
                const parentPanchayat = v.panchayat || panchayats.find((p) => p.id === v.panchayatId);
                const parentUnion = parentPanchayat?.union || unions.find((u: any) => u.id === parentPanchayat?.unionId);
                const unionName = parentUnion ? getOrgUnitName(parentUnion, locale) : '-';

                return (
                  <div
                    key={v.id}
                    className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 hover:shadow-md hover:border-[#8F0A1B]/30 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Parent Panchayat badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (parentPanchayat?.id) setSelectedPanchayatId(parentPanchayat.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors truncate max-w-[210px]"
                          title={`Panchayat: ${parentPanchayat?.name || '-'}`}
                        >
                          <Building className="w-3.5 h-3.5 text-[#8F0A1B] shrink-0" />
                          <span className="truncate">{parentPanchayat?.name || '-'}</span>
                        </button>

                        {v.centerLat && v.centerLng ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <Compass className="w-3.5 h-3.5 shrink-0" />
                            <span>GPS</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Header Avatar & Name */}
                      <div className="flex items-start gap-3.5 mb-3.5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8F0A1B] to-[#B81930] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          <MapPin className="w-5.5 h-5.5 text-[#FFC72C]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#8F0A1B] transition-colors"
                            title={v.name}
                          >
                            {v.name}
                          </h3>
                          {v.nameTa && v.nameTa !== v.name && (
                            <p className="text-sm sm:text-base text-[#8F0A1B] dark:text-[#FFC72C] font-semibold truncate mt-0.5">
                              {v.nameTa}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Org Unit info */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3.5 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <Building2 className="w-4 h-4 shrink-0 text-zinc-500" />
                        <span className="truncate">{unionName}</span>
                      </div>

                      {/* GPS Coordinates info */}
                      {v.centerLat && v.centerLng ? (
                        <div className="text-xs sm:text-sm font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-3.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                          <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{v.centerLat.toFixed(4)}° N, {v.centerLng.toFixed(4)}° E</span>
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 italic mb-3.5 px-3 py-1.5">
                          {locale === 'ta' ? 'அமைவிடம் வரையறுக்கப்படவில்லை' : 'Coordinates not configured'}
                        </div>
                      )}

                      {/* 2-Column Metrics Row with larger bold figures */}
                      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-center mb-3.5">
                        <div>
                          <div className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                            {v._count?.kilais ?? v.kilais?.length ?? 0}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">
                            {locale === 'ta' ? 'கிளைகள்' : 'Kilais'}
                          </div>
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                            {v._count?.booths ?? v.booths?.length ?? 0}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">
                            {locale === 'ta' ? 'சாவடிகள்' : 'Booths'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setMapPickerState({
                            isOpen: true,
                            target: 'quickVillage',
                            entityId: v.id,
                            title: locale === 'ta' && v.nameTa ? `${v.nameTa} (${v.name})` : v.name,
                            subtitle: parentPanchayat ? `${parentPanchayat.name} • ${unionName}` : undefined,
                            lat: v.centerLat || parentPanchayat?.centerLat || undefined,
                            lng: v.centerLng || parentPanchayat?.centerLng || undefined,
                            entityType: 'village',
                          });
                        }}
                        className={`h-9 w-9 rounded-xl cursor-pointer ${
                          v.centerLat && v.centerLng
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        }`}
                        title={
                          v.centerLat && v.centerLng
                            ? `${locale === 'ta' ? 'அமைவிடம்' : 'Location'}: ${v.centerLat.toFixed(4)}, ${v.centerLng.toFixed(4)}`
                            : (locale === 'ta' ? 'வரைபடத்தில் அமைவிடத்தை அமை' : 'Set Location on Map')
                        }
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenVillageDialog(v)}
                        className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 hover:text-primary cursor-pointer"
                        title={locale === 'ta' ? 'திருத்து' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'village',
                            id: v.id,
                            name: `${v.name} (${v.nameTa || ''})`,
                          })
                        }
                        className="h-9 w-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-500 hover:text-red-600 cursor-pointer"
                        title={locale === 'ta' ? 'நீக்கு' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 1: PANCHAYAT / WARD CREATE & EDIT */}
      {/* ========================================================================= */}
      <Dialog open={isPanchayatDialogOpen} onOpenChange={setIsPanchayatDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-bold">
              <Building className="w-5.5 h-5.5 text-primary" />
              <span>
                {editingPanchayat
                  ? (locale === 'ta' ? 'ஊராட்சி / வார்டைத் திருத்து' : 'Edit Panchayat / Ward')
                  : (locale === 'ta' ? 'புதிய ஊராட்சி / வார்டு சேர்க்க' : 'Add New Panchayat / Ward')}
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              {locale === 'ta'
                ? 'ஊராட்சி அல்லது வார்டின் விவரங்களை உள்ளிடவும்.'
                : 'Enter details for the Village Panchayat or Town/Municipality Ward.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePanchayat} className="space-y-4 pt-2">
            {!editingPanchayat && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                  {locale === 'ta' ? 'ஒரே நேரத்தில் பல ஊராட்சிகள் சேர்க்க வேண்டுமா?' : 'Need to add multiple panchayats at once?'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsPanchayatDialogOpen(false);
                    handleOpenBulkPanchayatDialog(panchayatForm.unionId);
                  }}
                  className="text-[#8F0A1B] dark:text-[#FFC72C] hover:bg-amber-500/10 font-bold px-2.5 h-7.5 text-xs sm:text-sm cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  {locale === 'ta' ? 'பல சேர்க்க (Bulk)' : 'Bulk Add'}
                </Button>
              </div>
            )}
            {/* Union Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'ஒன்றியம் *' : 'Union / Town Unit *'}
              </Label>
              <Select
                value={panchayatForm.unionId}
                onValueChange={(val) => setPanchayatForm({ ...panchayatForm, unionId: val || '' })}
                required
              >
                <SelectTrigger className="w-full h-11 rounded-xl text-sm sm:text-base font-semibold">
                  <SelectValue placeholder={locale === 'ta' ? 'ஒன்றியத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Union'}>
                    {(() => {
                      const u = unions.find((u: any) => u.id === panchayatForm.unionId);
                      if (!u) return '';
                      const uTa = getOrgUnitName(u, 'ta');
                      return locale === 'ta' && uTa && uTa !== u.name ? `${uTa} (${u.name})` : getOrgUnitName(u, locale);
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[280px] text-sm">
                  {unions.map((u: any) => {
                    const uTa = getOrgUnitName(u, 'ta');
                    const uLabel = locale === 'ta' && uTa && uTa !== u.name ? `${uTa} (${u.name})` : getOrgUnitName(u, locale);
                    return (
                      <SelectItem key={u.id} value={u.id} className="text-sm py-2">
                        {uLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Type Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'பிரதேச வகை *' : 'Territory Type *'}
              </Label>
              <Select
                value={panchayatForm.type}
                onValueChange={(val: any) => setPanchayatForm({ ...panchayatForm, type: val || 'VILLAGE_PANCHAYAT' })}
              >
                <SelectTrigger className="w-full h-11 rounded-xl text-sm sm:text-base font-semibold">
                  <SelectValue>
                    {panchayatForm.type === 'TOWN_PANCHAYAT_WARD'
                      ? (locale === 'ta' ? 'பேரூராட்சி வார்டு (Town Panchayat Ward)' : 'Town Panchayat Ward')
                      : panchayatForm.type === 'MUNICIPALITY_WARD'
                      ? (locale === 'ta' ? 'நகராட்சி வார்டு (Municipality Ward)' : 'Municipality Ward')
                      : (locale === 'ta' ? 'கிராம ஊராட்சி (Village Panchayat)' : 'Village Panchayat')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="text-sm">
                  <SelectItem value="VILLAGE_PANCHAYAT" className="py-2">
                    {locale === 'ta' ? 'கிராம ஊராட்சி (Village Panchayat)' : 'Village Panchayat'}
                  </SelectItem>
                  <SelectItem value="TOWN_PANCHAYAT_WARD" className="py-2">
                    {locale === 'ta' ? 'பேரூராட்சி வார்டு (Town Panchayat Ward)' : 'Town Panchayat Ward'}
                  </SelectItem>
                  <SelectItem value="MUNICIPALITY_WARD" className="py-2">
                    {locale === 'ta' ? 'நகராட்சி வார்டு (Municipality Ward)' : 'Municipality Ward'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ward Number (if Town/Municipality Ward) */}
            {panchayatForm.type !== 'VILLAGE_PANCHAYAT' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === 'ta' ? 'வார்டு எண் *' : 'Ward Number *'}
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={panchayatForm.wardNumber ?? ''}
                  onChange={(e) =>
                    setPanchayatForm({
                      ...panchayatForm,
                      wardNumber: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  placeholder="e.g. 1, 2, 15"
                  className="h-11 rounded-xl text-sm sm:text-base"
                  required
                />
              </div>
            )}

            {/* Name (English) */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'பெயர் (ஆங்கிலம்) *' : 'Name (English) *'}
              </Label>
              <Input
                value={panchayatForm.name}
                onChange={(e) => setPanchayatForm({ ...panchayatForm, name: e.target.value })}
                placeholder="e.g. Karaikadu or Ward 1"
                className="h-11 rounded-xl text-sm sm:text-base"
                required
              />
            </div>

            {/* Name (Tamil) */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'பெயர் (தமிழ்) *' : 'Name (Tamil) *'}
              </Label>
              <Input
                value={panchayatForm.nameTa}
                onChange={(e) => setPanchayatForm({ ...panchayatForm, nameTa: e.target.value })}
                placeholder="எ.கா. காரைக்காடு அல்லது வார்டு 1"
                className="h-11 rounded-xl text-sm sm:text-base"
                required
              />
            </div>

            {/* Geographic Coordinates (Lat / Long) */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8F0A1B]" />
                  {locale === 'ta' ? 'புவியியல் அமைவிடம் (GPS)' : 'Coordinates (Lat / Long)'}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fallbackLat = panchayatForm.centerLat;
                    const fallbackLng = panchayatForm.centerLng;
                    setMapPickerState({
                      isOpen: true,
                      target: 'panchayatForm',
                      title: panchayatForm.name
                        ? (locale === 'ta' && panchayatForm.nameTa ? `${panchayatForm.nameTa} (${panchayatForm.name})` : panchayatForm.name)
                        : (locale === 'ta' ? 'ஊராட்சி அமைவிடம்' : 'Panchayat Location'),
                      subtitle: locale === 'ta' ? 'வரைபடத்தில் கிளிக் செய்து அட்சரேகை/தீர்க்கரேகையைத் தேர்வு செய்க' : 'Click on the map to pin precise coordinates',
                      lat: fallbackLat,
                      lng: fallbackLng,
                      entityType: 'panchayat',
                    });
                  }}
                  className="h-7 text-xs font-bold text-[#8F0A1B] dark:text-[#FFC72C] hover:bg-[#8F0A1B]/10 border-[#8F0A1B]/30 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  {locale === 'ta' ? 'வரைபடத்தில் தேர்வு செய்' : 'Pick from Map'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {locale === 'ta' ? 'அட்சரேகை (Latitude)' : 'Latitude'}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={panchayatForm.centerLat ?? ''}
                    onChange={(e) =>
                      setPanchayatForm({
                        ...panchayatForm,
                        centerLat: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="11.564"
                    className="h-9.5 rounded-lg text-xs sm:text-sm font-mono bg-white dark:bg-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {locale === 'ta' ? 'தீர்க்கரேகை (Longitude)' : 'Longitude'}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={panchayatForm.centerLng ?? ''}
                    onChange={(e) =>
                      setPanchayatForm({
                        ...panchayatForm,
                        centerLng: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="79.682"
                    className="h-9.5 rounded-lg text-xs sm:text-sm font-mono bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'விளக்கம் / குறிப்பு' : 'Description / Notes'}
              </Label>
              <Input
                value={panchayatForm.description || ''}
                onChange={(e) => setPanchayatForm({ ...panchayatForm, description: e.target.value })}
                placeholder="Optional notes"
                className="h-11 rounded-xl text-sm sm:text-base"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPanchayatDialogOpen(false)}
                className="h-10.5 px-4 rounded-xl text-sm font-bold cursor-pointer"
              >
                {locale === 'ta' ? 'ரத்து' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={createPanchayat.isPending || updatePanchayat.isPending}
                className="bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white font-bold h-10.5 px-5 rounded-xl text-sm cursor-pointer"
              >
                {createPanchayat.isPending || updatePanchayat.isPending ? (
                  locale === 'ta' ? 'சேமிக்கிறது...' : 'Saving...'
                ) : (
                  locale === 'ta' ? 'சேமி' : 'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 2: VILLAGE / HAMLET CREATE & EDIT */}
      {/* ========================================================================= */}
      <Dialog open={isVillageDialogOpen} onOpenChange={setIsVillageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-bold">
              <MapPin className="w-5.5 h-5.5 text-primary" />
              <span>
                {editingVillage
                  ? (locale === 'ta' ? 'கிராமத்தைத் திருத்து' : 'Edit Village / Hamlet')
                  : (locale === 'ta' ? 'புதிய கிராமம் / குடியிருப்பு சேர்க்க' : 'Add New Village / Hamlet')}
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              {locale === 'ta'
                ? 'ஊராட்சியின் கீழ் உள்ள கிராமம் அல்லது குடியிருப்பின் விவரங்களை உள்ளிடவும்.'
                : 'Enter details for the village or hamlet habitation under the selected Panchayat.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVillage} className="space-y-4 pt-2">
            {!editingVillage && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                  {locale === 'ta' ? 'ஒரே நேரத்தில் பல கிராமங்கள் சேர்க்க வேண்டுமா?' : 'Need to add multiple villages at once?'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsVillageDialogOpen(false);
                    handleOpenBulkVillageDialog(villageUnionFilter, villageForm.panchayatId);
                  }}
                  className="text-[#8F0A1B] dark:text-[#FFC72C] hover:bg-amber-500/10 font-bold px-2.5 h-7.5 text-xs sm:text-sm cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  {locale === 'ta' ? 'பல சேர்க்க (Bulk)' : 'Bulk Add'}
                </Button>
              </div>
            )}
            {/* Filter Panchayat by Union */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'ஒன்றியத்தின் மூலம் வடிகட்டவும்' : 'Filter by Union'}
              </Label>
              <Select
                value={villageUnionFilter}
                onValueChange={(val) => {
                  const uVal = val || '';
                  setVillageUnionFilter(uVal);
                  // Auto-select first panchayat of this union
                  const matched = panchayats.find((p) => p.unionId === uVal);
                  if (matched) {
                    setVillageForm({ ...villageForm, panchayatId: matched.id });
                  }
                }}
              >
                <SelectTrigger className="w-full h-11 rounded-xl text-sm sm:text-base font-semibold">
                  <SelectValue placeholder={locale === 'ta' ? 'அனைத்து ஒன்றியங்கள்' : 'All Unions'}>
                    {(() => {
                      const u = unions.find((u: any) => u.id === villageUnionFilter);
                      if (!u) return locale === 'ta' ? 'அனைத்து ஒன்றியங்கள்' : 'All Unions';
                      const uTa = getOrgUnitName(u, 'ta');
                      return locale === 'ta' && uTa && uTa !== u.name ? `${uTa} (${u.name})` : getOrgUnitName(u, locale);
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[280px] text-sm">
                  {unions.map((u: any) => {
                    const uTa = getOrgUnitName(u, 'ta');
                    const uLabel = locale === 'ta' && uTa && uTa !== u.name ? `${uTa} (${u.name})` : getOrgUnitName(u, locale);
                    return (
                      <SelectItem key={u.id} value={u.id} className="text-sm py-2">
                        {uLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Parent Panchayat Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'தாய் ஊராட்சி / வார்டு *' : 'Parent Panchayat / Ward *'}
              </Label>
              <Select
                value={villageForm.panchayatId}
                onValueChange={(val) => setVillageForm({ ...villageForm, panchayatId: val || '' })}
                required
              >
                <SelectTrigger className="w-full h-11 rounded-xl text-sm sm:text-base font-semibold">
                  <SelectValue placeholder={locale === 'ta' ? 'ஊராட்சியைத் தேர்ந்தெடுக்கவும்' : 'Select Panchayat'}>
                    {(() => {
                      const p = panchayats.find((p: any) => p.id === villageForm.panchayatId);
                      return p ? (locale === 'ta' && p.nameTa ? `${p.nameTa} (${p.name})` : p.name) : '';
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[280px] text-sm">
                  {dialogPanchayats.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm py-2">
                      {locale === 'ta' && p.nameTa ? `${p.nameTa} (${p.name})` : p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name (English) */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'கிராம பெயர் (ஆங்கிலம்) *' : 'Village Name (English) *'}
              </Label>
              <Input
                value={villageForm.name}
                onChange={(e) => setVillageForm({ ...villageForm, name: e.target.value })}
                placeholder="e.g. Karaikadu South"
                className="h-11 rounded-xl text-sm sm:text-base"
                required
              />
            </div>

            {/* Name (Tamil) */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'கிராம பெயர் (தமிழ்) *' : 'Village Name (Tamil) *'}
              </Label>
              <Input
                value={villageForm.nameTa}
                onChange={(e) => setVillageForm({ ...villageForm, nameTa: e.target.value })}
                placeholder="எ.கா. காரைக்காடு தெற்கு"
                className="h-11 rounded-xl text-sm sm:text-base"
                required
              />
            </div>

            {/* Geographic Coordinates (Lat / Long) */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8F0A1B]" />
                  {locale === 'ta' ? 'புவியியல் அமைவிடம் (GPS)' : 'Coordinates (Lat / Long)'}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const parentPanchayat = panchayats.find((p: any) => p.id === villageForm.panchayatId);
                    const lat = villageForm.centerLat || parentPanchayat?.centerLat;
                    const lng = villageForm.centerLng || parentPanchayat?.centerLng;
                    setMapPickerState({
                      isOpen: true,
                      target: 'villageForm',
                      title: villageForm.name
                        ? (locale === 'ta' && villageForm.nameTa ? `${villageForm.nameTa} (${villageForm.name})` : villageForm.name)
                        : (locale === 'ta' ? 'கிராம அமைவிடம்' : 'Village Location'),
                      subtitle: parentPanchayat
                        ? (locale === 'ta' ? `தாய் ஊராட்சி: ${parentPanchayat.nameTa || parentPanchayat.name}` : `Panchayat: ${parentPanchayat.name}`)
                        : undefined,
                      lat,
                      lng,
                      entityType: 'village',
                    });
                  }}
                  className="h-7 text-xs font-bold text-[#8F0A1B] dark:text-[#FFC72C] hover:bg-[#8F0A1B]/10 border-[#8F0A1B]/30 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  {locale === 'ta' ? 'வரைபடத்தில் தேர்வு செய்' : 'Pick from Map'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {locale === 'ta' ? 'அட்சரேகை (Latitude)' : 'Latitude'}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={villageForm.centerLat ?? ''}
                    onChange={(e) =>
                      setVillageForm({
                        ...villageForm,
                        centerLat: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="11.564"
                    className="h-9.5 rounded-lg text-xs sm:text-sm font-mono bg-white dark:bg-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {locale === 'ta' ? 'தீர்க்கரேகை (Longitude)' : 'Longitude'}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={villageForm.centerLng ?? ''}
                    onChange={(e) =>
                      setVillageForm({
                        ...villageForm,
                        centerLng: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="79.682"
                    className="h-9.5 rounded-lg text-xs sm:text-sm font-mono bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'விளக்கம் / குடியிருப்புகள்' : 'Description / Hamlets'}
              </Label>
              <Input
                value={villageForm.description || ''}
                onChange={(e) => setVillageForm({ ...villageForm, description: e.target.value })}
                placeholder="e.g. Main village and adjoining colony"
                className="h-11 rounded-xl text-sm sm:text-base"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVillageDialogOpen(false)}
                className="h-10.5 px-4 rounded-xl text-sm font-bold cursor-pointer"
              >
                {locale === 'ta' ? 'ரத்து' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={createVillage.isPending || updateVillage.isPending}
                className="bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white font-bold h-10.5 px-5 rounded-xl text-sm cursor-pointer"
              >
                {createVillage.isPending || updateVillage.isPending ? (
                  locale === 'ta' ? 'சேமிக்கிறது...' : 'Saving...'
                ) : (
                  locale === 'ta' ? 'சேமி' : 'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 3: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-destructive text-lg sm:text-xl font-bold">
              <AlertTriangle className="w-5.5 h-5.5 text-red-600" />
              <span>{locale === 'ta' ? 'நீக்க உறுதிப்படுத்தவும்' : 'Confirm Deletion'}</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base pt-1 text-zinc-600 dark:text-zinc-400">
              {locale === 'ta' ? (
                <>
                  நிச்சயமாக <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{deleteTarget?.name}</strong> ஐ நீக்க விரும்புகிறீர்களா? இந்த நடவடிக்கை மாற்ற முடியாதது.
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{deleteTarget?.name}</strong>? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="h-10.5 px-4 rounded-xl text-sm font-bold cursor-pointer"
            >
              {locale === 'ta' ? 'ரத்து' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletePanchayat.isPending || deleteVillage.isPending}
              onClick={handleConfirmDelete}
              className="h-10.5 px-5 rounded-xl text-sm font-bold cursor-pointer"
            >
              {deletePanchayat.isPending || deleteVillage.isPending ? (
                locale === 'ta' ? 'நீக்குகிறது...' : 'Deleting...'
              ) : (
                locale === 'ta' ? 'நீக்கு' : 'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 4: BULK ADD PANCHAYATS / WARDS */}
      {/* ========================================================================= */}
      <Dialog
        open={isBulkPanchayatDialogOpen}
        onOpenChange={(open) => !bulkPanchayatSubmitting && setIsBulkPanchayatDialogOpen(open)}
      >
        <DialogContent className="w-[95vw] sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#8F0A1B]/10 text-[#8F0A1B] dark:text-[#FFC72C]">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {locale === 'ta' ? 'ஒரே நேரத்தில் பல ஊராட்சிகள் / வார்டுகள் சேர்க்க' : 'Add Multiple Panchayats / Wards'}
                  </h2>
                  <Badge variant="outline" className="border-[#8F0A1B]/30 text-[#8F0A1B] dark:text-[#FFC72C] font-semibold text-xs">
                    {locale === 'ta' ? 'மொத்த சேர்க்கை' : 'Bulk Mode'}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {locale === 'ta'
                    ? 'ஒன்றியத்தைத் தேர்ந்தெடுத்து வரிசையாக உள்ளிடவும் அல்லது பெயர் பட்டியலை ஒட்டவும்.'
                    : 'Select the target Union and enter multiple panchayats row-by-row or paste a list.'}
                </p>
              </div>
            </div>

            {/* Target Union Selector & Mode Switch */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === 'ta' ? 'இலக்கு ஒன்றியம் *' : 'Target Union / Town Unit *'}
                </Label>
                <Select
                  value={bulkPanchayatUnionId}
                  onValueChange={(val) => setBulkPanchayatUnionId(val || '')}
                  disabled={bulkPanchayatSubmitting}
                >
                  <SelectTrigger className="w-full h-10.5 rounded-xl text-sm font-semibold bg-white dark:bg-zinc-900">
                    <SelectValue placeholder={locale === 'ta' ? 'ஒன்றியத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Union'}>
                      {(() => {
                        const u = unions.find((u: any) => u.id === bulkPanchayatUnionId);
                        if (!u) return '';
                        const uTa = getOrgUnitName(u, 'ta');
                        return locale === 'ta' && uTa && uTa !== u.name ? `${uTa} (${u.name})` : getOrgUnitName(u, locale);
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[260px] text-sm">
                    {unions.map((u: any) => {
                      const uTa = getOrgUnitName(u, 'ta');
                      const uLabel = locale === 'ta' && uTa && uTa !== u.name ? `${uTa} (${u.name})` : getOrgUnitName(u, locale);
                      return (
                        <SelectItem key={u.id} value={u.id} className="text-sm py-2">
                          {uLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setBulkPanchayatMode('rows')}
                    className={`flex-1 h-8.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      bulkPanchayatMode === 'rows'
                        ? 'bg-[#8F0A1B] text-white shadow-xs hover:bg-[#8F0A1B] hover:text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <ListPlus className="w-3.5 h-3.5 mr-1.5" />
                    {locale === 'ta' ? 'வரிசை திருத்தி' : 'Row Editor'} ({bulkPanchayatRows.filter((r) => r.name.trim()).length})
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setBulkPanchayatMode('paste')}
                    className={`flex-1 h-8.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      bulkPanchayatMode === 'paste'
                        ? 'bg-[#8F0A1B] text-white shadow-xs hover:bg-[#8F0A1B] hover:text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    {locale === 'ta' ? 'பட்டியலை ஒட்டவும்' : 'Quick Paste'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {bulkPanchayatMode === 'paste' ? (
              /* QUICK PASTE MODE */
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs sm:text-sm text-blue-900 dark:text-blue-300">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {locale === 'ta' ? 'விரைவு ஒட்டுதல் வழிமுறை:' : 'Quick Paste Instructions:'}
                  </p>
                  <p>
                    {locale === 'ta'
                      ? 'ஒவ்வொரு வரியிலும் ஒரு ஊராட்சி பெயரை இடவும். ஆங்கிலம் மற்றும் தமிழ் பெயரை காற்புள்ளி (,) அல்லது தத்தல் (Tab) மூலம் பிரிக்கலாம்:'
                      : 'Paste one name per line. You can enter English names alone, or comma-separated English, Tamil names:'}
                  </p>
                  <pre className="mt-2 p-2.5 rounded-lg bg-white/70 dark:bg-black/30 text-xs font-mono text-zinc-800 dark:text-zinc-200">
                    {`Kadirvedu, கதிர்வேடு\nPuzhal, புழல்\nSurapet, சூரப்பட்டு`}
                  </pre>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {locale === 'ta'
                      ? 'தமிழ் பெயர் விடுபட்டிருந்தால், அகராதி மூலம் தானாக மொழிபெயர்க்கப்படும்.'
                      : 'If Tamil name is omitted, it will be automatically generated from directory if available.'}
                  </p>
                </div>

                <Textarea
                  value={bulkPanchayatPasteText}
                  onChange={(e) => setBulkPanchayatPasteText(e.target.value)}
                  placeholder={locale === 'ta' ? 'பெயர்களை இங்கே ஒட்டவும்...' : 'Paste names here, one per line...'}
                  rows={8}
                  className="font-mono text-sm rounded-xl p-3"
                />

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleParseBulkPanchayatPaste}
                    disabled={!bulkPanchayatPasteText.trim()}
                    className="bg-[#8F0A1B] hover:bg-[#B81930] text-white font-bold h-10 px-4 rounded-xl cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {locale === 'ta' ? 'அட்டவணையில் ஏற்றவும்' : 'Parse & Load to Rows'}
                  </Button>
                </div>
              </div>
            ) : (
              /* ROW EDITOR MODE */
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse min-w-[760px]">
                    <thead className="bg-zinc-100 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[220px]">{locale === 'ta' ? 'ஆங்கிலப் பெயர் *' : 'English Name *'}</th>
                        <th className="py-2.5 px-3 min-w-[220px]">{locale === 'ta' ? 'தமிழ்ப் பெயர்' : 'Tamil Name'}</th>
                        <th className="py-2.5 px-3 w-56">{locale === 'ta' ? 'வகை' : 'Type'}</th>
                        <th className="py-2.5 px-3 w-28">{locale === 'ta' ? 'வார்டு எண்' : 'Ward #'}</th>
                        <th className="py-2.5 px-3 w-14 text-center">{locale === 'ta' ? 'நீக்கு' : 'Del'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {bulkPanchayatRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="py-2 px-3 text-center text-xs font-mono font-bold text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={row.name}
                              placeholder="e.g. Kadirvedu"
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkPanchayatRows((prev) =>
                                  prev.map((r, i) => {
                                    if (i !== idx) return r;
                                    const updated = { ...r, name: val };
                                    if (!r.nameTa) {
                                      const auto = translateAreaToTamil(val);
                                      if (auto && auto.toLowerCase() !== val.toLowerCase()) {
                                        updated.nameTa = auto;
                                      }
                                    }
                                    return updated;
                                  })
                                );
                              }}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val && !row.nameTa) {
                                  const auto = translateAreaToTamil(val);
                                  if (auto && auto.toLowerCase() !== val.toLowerCase()) {
                                    setBulkPanchayatRows((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, nameTa: auto } : r))
                                    );
                                  }
                                }
                              }}
                              className="h-9 text-sm rounded-lg"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={row.nameTa}
                              placeholder="எ.கா. கதிர்வேடு"
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkPanchayatRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, nameTa: val } : r))
                                );
                              }}
                              className="h-9 text-sm rounded-lg"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Select
                              value={row.type}
                              onValueChange={(val: any) => {
                                setBulkPanchayatRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, type: val } : r))
                                );
                              }}
                            >
                              <SelectTrigger className="h-9 text-xs rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="text-xs">
                                <SelectItem value="VILLAGE_PANCHAYAT">Village Panchayat</SelectItem>
                                <SelectItem value="TOWN_PANCHAYAT_WARD">Town Ward</SelectItem>
                                <SelectItem value="MUNICIPALITY_WARD">Municipality Ward</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              min="1"
                              value={row.wardNumber ?? ''}
                              disabled={row.type === 'VILLAGE_PANCHAYAT'}
                              placeholder="-"
                              onChange={(e) => {
                                const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                setBulkPanchayatRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, wardNumber: val } : r))
                                );
                              }}
                              className="h-9 text-sm rounded-lg w-20"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setBulkPanchayatRows((prev) => {
                                  if (prev.length <= 1) return [{ id: `bp-${Date.now()}`, name: '', nameTa: '', type: 'VILLAGE_PANCHAYAT' }];
                                  return prev.filter((_, i) => i !== idx);
                                });
                              }}
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table quick actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBulkPanchayatRows((prev) => [
                          ...prev,
                          { id: `bp-${Date.now()}`, name: '', nameTa: '', type: 'VILLAGE_PANCHAYAT' },
                        ]);
                      }}
                      className="h-8 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {locale === 'ta' ? 'வரிசை சேர்க்க' : 'Add Row'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOnes = Array.from({ length: 5 }).map((_, i) => ({
                          id: `bp-${Date.now()}-${i}`,
                          name: '',
                          nameTa: '',
                          type: 'VILLAGE_PANCHAYAT' as const,
                        }));
                        setBulkPanchayatRows((prev) => [...prev, ...newOnes]);
                      }}
                      className="h-8 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      +5 {locale === 'ta' ? 'வரிசைகள்' : 'Rows'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBulkPanchayatRows((prev) => {
                          const valid = prev.filter((r) => r.name.trim());
                          return valid.length > 0
                            ? valid
                            : [{ id: `bp-${Date.now()}`, name: '', nameTa: '', type: 'VILLAGE_PANCHAYAT' }];
                        });
                      }}
                      className="h-8 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs cursor-pointer"
                    >
                      {locale === 'ta' ? 'வெற்று வரிகளை நீக்கு' : 'Clean Blank Rows'}
                    </Button>
                  </div>

                  <span className="text-zinc-500 font-medium">
                    {bulkPanchayatRows.filter((r) => r.name.trim().length > 0).length}{' '}
                    {locale === 'ta' ? 'செல்லுபடியாகும் ஊராட்சிகள் தயார்' : 'valid panchayats ready'}
                  </span>
                </div>
              </div>
            )}

            {/* Progress / Status Display */}
            {bulkPanchayatProgress && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center gap-3 text-sm animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                <span>
                  {locale === 'ta' ? 'சேமிக்கப்படுகிறது:' : 'Saving:'}{' '}
                  <strong>{bulkPanchayatProgress.currentName}</strong> ({bulkPanchayatProgress.current} /{' '}
                  {bulkPanchayatProgress.total})...
                </span>
              </div>
            )}

            {/* Results / Error Display */}
            {bulkPanchayatResult && (
              <div
                className={`p-3.5 rounded-xl border text-sm space-y-1.5 ${
                  bulkPanchayatResult.failed === 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {bulkPanchayatResult.failed === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  <span>
                    {bulkPanchayatResult.success}{' '}
                    {locale === 'ta' ? 'ஊராட்சிகள் வெற்றிகரமாக சேர்க்கப்பட்டன!' : 'panchayats added successfully!'}
                    {bulkPanchayatResult.failed > 0 && ` (${bulkPanchayatResult.failed} failed)`}
                  </span>
                </div>
                {bulkPanchayatResult.errors.length > 0 && (
                  <ul className="text-xs list-disc pl-5 text-red-600 dark:text-red-400 space-y-0.5">
                    {bulkPanchayatResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={bulkPanchayatSubmitting}
              onClick={() => setIsBulkPanchayatDialogOpen(false)}
              className="h-10.5 px-4 rounded-xl text-sm font-bold cursor-pointer"
            >
              {locale === 'ta' ? 'ரத்து' : 'Cancel'}
            </Button>
            <Button
              type="button"
              disabled={
                bulkPanchayatSubmitting ||
                !bulkPanchayatUnionId ||
                bulkPanchayatRows.filter((r) => r.name.trim()).length === 0
              }
              onClick={handleSaveBulkPanchayats}
              className="bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white font-bold h-10.5 px-5 rounded-xl text-sm flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {bulkPanchayatSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{locale === 'ta' ? 'சேமிக்கிறது...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {locale === 'ta' ? 'அனைத்தையும் சேர்க்க' : 'Add All'}{' '}
                    ({bulkPanchayatRows.filter((r) => r.name.trim()).length})
                  </span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 5: BULK ADD VILLAGES / HAMLETS */}
      {/* ========================================================================= */}
      <Dialog
        open={isBulkVillageDialogOpen}
        onOpenChange={(open) => !bulkVillageSubmitting && setIsBulkVillageDialogOpen(open)}
      >
        <DialogContent className="w-[95vw] sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#8F0A1B]/10 text-[#8F0A1B] dark:text-[#FFC72C]">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {locale === 'ta' ? 'ஒரே நேரத்தில் பல கிராமங்கள் / குடியிருப்புகள் சேர்க்க' : 'Add Multiple Villages / Hamlets'}
                  </h2>
                  <Badge variant="outline" className="border-[#8F0A1B]/30 text-[#8F0A1B] dark:text-[#FFC72C] font-semibold text-xs">
                    {locale === 'ta' ? 'மொத்த சேர்க்கை' : 'Bulk Mode'}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {locale === 'ta'
                    ? 'தாய் ஊராட்சியைத் தேர்ந்தெடுத்து வரிசையாக கிராமங்களை உள்ளிடவும் அல்லது பெயர் பட்டியலை ஒட்டவும்.'
                    : 'Select the Parent Panchayat and enter multiple villages row-by-row or paste a list.'}
                </p>
              </div>
            </div>

            {/* Target Union, Target Panchayat Selector & Mode Switch */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              {/* Union Filter */}
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === 'ta' ? 'ஒன்றியம் *' : 'Filter by Union *'}
                </Label>
                <Select
                  value={bulkVillageUnionId}
                  onValueChange={(val) => {
                    const uVal = val || '';
                    setBulkVillageUnionId(uVal);
                    const list = allPanchayats.length > 0 ? allPanchayats : panchayats;
                    const matched = list.find((p) => p.unionId === uVal);
                    setBulkVillagePanchayatId(matched ? matched.id : '');
                  }}
                  disabled={bulkVillageSubmitting}
                >
                  <SelectTrigger className="w-full h-10.5 rounded-xl text-sm font-semibold bg-white dark:bg-zinc-900">
                    <SelectValue placeholder={locale === 'ta' ? 'ஒன்றியத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Union'}>
                      {(() => {
                        const u = unions.find((u: any) => u.id === bulkVillageUnionId);
                        if (!u) return '';
                        const uTa = getOrgUnitName(u, 'ta');
                        return locale === 'ta' && uTa && uTa !== u.name ? `${uTa} (${u.name})` : getOrgUnitName(u, locale);
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[260px] text-sm">
                    {unions.map((u: any) => {
                      const uTa = getOrgUnitName(u, 'ta');
                      const uLabel = locale === 'ta' && uTa && uTa !== u.name ? `${uTa} (${u.name})` : getOrgUnitName(u, locale);
                      return (
                        <SelectItem key={u.id} value={u.id} className="text-sm py-2">
                          {uLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Parent Panchayat Selector */}
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === 'ta' ? 'தாய் ஊராட்சி / வார்டு *' : 'Parent Panchayat *'}
                </Label>
                <Select
                  value={bulkVillagePanchayatId}
                  onValueChange={(val) => setBulkVillagePanchayatId(val || '')}
                  disabled={bulkVillageSubmitting}
                >
                  <SelectTrigger className="w-full h-10.5 rounded-xl text-sm font-semibold bg-white dark:bg-zinc-900">
                    <SelectValue placeholder={locale === 'ta' ? 'ஊராட்சியைத் தேர்ந்தெடுக்கவும்' : 'Select Panchayat'}>
                      {(() => {
                        const list = allPanchayats.length > 0 ? allPanchayats : panchayats;
                        const p = list.find((p: any) => p.id === bulkVillagePanchayatId);
                        return p ? (locale === 'ta' && p.nameTa ? `${p.nameTa} (${p.name})` : p.name) : '';
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[260px] text-sm">
                    {bulkVillageAvailablePanchayats.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-sm py-2">
                        {locale === 'ta' && p.nameTa ? `${p.nameTa} (${p.name})` : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setBulkVillageMode('rows')}
                    className={`flex-1 h-8.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      bulkVillageMode === 'rows'
                        ? 'bg-[#8F0A1B] text-white shadow-xs hover:bg-[#8F0A1B] hover:text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <ListPlus className="w-3.5 h-3.5 mr-1.5" />
                    {locale === 'ta' ? 'வரிசை திருத்தி' : 'Row Editor'} ({bulkVillageRows.filter((r) => r.name.trim()).length})
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setBulkVillageMode('paste')}
                    className={`flex-1 h-8.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      bulkVillageMode === 'paste'
                        ? 'bg-[#8F0A1B] text-white shadow-xs hover:bg-[#8F0A1B] hover:text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    {locale === 'ta' ? 'பட்டியலை ஒட்டவும்' : 'Quick Paste'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {bulkVillageMode === 'paste' ? (
              /* QUICK PASTE MODE */
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs sm:text-sm text-blue-900 dark:text-blue-300">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {locale === 'ta' ? 'விரைவு ஒட்டுதல் வழிமுறை:' : 'Quick Paste Instructions:'}
                  </p>
                  <p>
                    {locale === 'ta'
                      ? 'ஒவ்வொரு வரியிலும் ஒரு கிராமத்தின் பெயரை இடவும். ஆங்கிலம் மற்றும் தமிழ் பெயரை காற்புள்ளி (,) அல்லது தத்தல் (Tab) மூலம் பிரிக்கலாம்:'
                      : 'Paste one name per line. You can enter English names alone, or comma-separated English, Tamil names:'}
                  </p>
                  <pre className="mt-2 p-2.5 rounded-lg bg-white/70 dark:bg-black/30 text-xs font-mono text-zinc-800 dark:text-zinc-200">
                    {`Semmankuppam, செம்மங்குப்பம்\nKudikadu, குடிகாடு\nSedapalayam, சேடபாளையம்`}
                  </pre>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {locale === 'ta'
                      ? 'தமிழ் பெயர் மற்றும் அறியப்பட்ட ஆயத்தொலைவுகள் (Coordinates) தானாகப் பொருத்தப்படும்.'
                      : 'Tamil translation and directory coordinates (if known) will be automatically detected.'}
                  </p>
                </div>

                <Textarea
                  value={bulkVillagePasteText}
                  onChange={(e) => setBulkVillagePasteText(e.target.value)}
                  placeholder={locale === 'ta' ? 'கிராமப் பெயர்களை இங்கே ஒட்டவும்...' : 'Paste village names here, one per line...'}
                  rows={8}
                  className="font-mono text-sm rounded-xl p-3"
                />

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleParseBulkVillagePaste}
                    disabled={!bulkVillagePasteText.trim()}
                    className="bg-[#8F0A1B] hover:bg-[#B81930] text-white font-bold h-10 px-4 rounded-xl cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {locale === 'ta' ? 'அட்டவணையில் ஏற்றவும்' : 'Parse & Load to Rows'}
                  </Button>
                </div>
              </div>
            ) : (
              /* ROW EDITOR MODE */
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse min-w-[760px]">
                    <thead className="bg-zinc-100 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[240px]">{locale === 'ta' ? 'ஆங்கிலப் பெயர் *' : 'English Name *'}</th>
                        <th className="py-2.5 px-3 min-w-[240px]">{locale === 'ta' ? 'தமிழ்ப் பெயர்' : 'Tamil Name'}</th>
                        <th className="py-2.5 px-3 w-36">{locale === 'ta' ? 'அட்சரேகை (Lat)' : 'Latitude'}</th>
                        <th className="py-2.5 px-3 w-36">{locale === 'ta' ? 'தீர்க்கரேகை (Lng)' : 'Longitude'}</th>
                        <th className="py-2.5 px-3 w-14 text-center">{locale === 'ta' ? 'நீக்கு' : 'Del'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {bulkVillageRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="py-2 px-3 text-center text-xs font-mono font-bold text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={row.name}
                              placeholder="e.g. Semmankuppam"
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkVillageRows((prev) =>
                                  prev.map((r, i) => {
                                    if (i !== idx) return r;
                                    const updated = { ...r, name: val };
                                    if (!r.nameTa) {
                                      const auto = translateAreaToTamil(val);
                                      if (auto && auto.toLowerCase() !== val.toLowerCase()) {
                                        updated.nameTa = auto;
                                      }
                                    }
                                    return updated;
                                  })
                                );
                              }}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  setBulkVillageRows((prev) =>
                                    prev.map((r, i) => {
                                      if (i !== idx) return r;
                                      const updated = { ...r };
                                      if (!r.nameTa) {
                                        const auto = translateAreaToTamil(val);
                                        if (auto && auto.toLowerCase() !== val.toLowerCase()) {
                                          updated.nameTa = auto;
                                        }
                                      }
                                      if (r.centerLat === undefined || r.centerLng === undefined) {
                                        const geo = getAreaGeoData(val);
                                        if (geo && geo.center) {
                                          updated.centerLat = geo.center[0];
                                          updated.centerLng = geo.center[1];
                                        }
                                      }
                                      return updated;
                                    })
                                  );
                                }
                              }}
                              className="h-9 text-sm rounded-lg"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={row.nameTa}
                              placeholder="எ.கா. செம்மங்குப்பம்"
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkVillageRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, nameTa: val } : r))
                                );
                              }}
                              className="h-9 text-sm rounded-lg"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="any"
                              value={row.centerLat ?? ''}
                              placeholder="11.7500"
                              onChange={(e) => {
                                const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                setBulkVillageRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, centerLat: val } : r))
                                );
                              }}
                              className="h-9 text-xs rounded-lg"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="any"
                              value={row.centerLng ?? ''}
                              placeholder="79.7600"
                              onChange={(e) => {
                                const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                setBulkVillageRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, centerLng: val } : r))
                                );
                              }}
                              className="h-9 text-xs rounded-lg"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setBulkVillageRows((prev) => {
                                  if (prev.length <= 1) return [{ id: `bv-${Date.now()}`, name: '', nameTa: '' }];
                                  return prev.filter((_, i) => i !== idx);
                                });
                              }}
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table quick actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBulkVillageRows((prev) => [
                          ...prev,
                          { id: `bv-${Date.now()}`, name: '', nameTa: '' },
                        ]);
                      }}
                      className="h-8 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {locale === 'ta' ? 'வரிசை சேர்க்க' : 'Add Row'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOnes = Array.from({ length: 5 }).map((_, i) => ({
                          id: `bv-${Date.now()}-${i}`,
                          name: '',
                          nameTa: '',
                        }));
                        setBulkVillageRows((prev) => [...prev, ...newOnes]);
                      }}
                      className="h-8 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      +5 {locale === 'ta' ? 'வரிசைகள்' : 'Rows'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBulkVillageRows((prev) => {
                          const valid = prev.filter((r) => r.name.trim());
                          return valid.length > 0
                            ? valid
                            : [{ id: `bv-${Date.now()}`, name: '', nameTa: '' }];
                        });
                      }}
                      className="h-8 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs cursor-pointer"
                    >
                      {locale === 'ta' ? 'வெற்று வரிகளை நீக்கு' : 'Clean Blank Rows'}
                    </Button>
                  </div>

                  <span className="text-zinc-500 font-medium">
                    {bulkVillageRows.filter((r) => r.name.trim().length > 0).length}{' '}
                    {locale === 'ta' ? 'செல்லுபடியாகும் கிராமங்கள் தயார்' : 'valid villages ready'}
                  </span>
                </div>
              </div>
            )}

            {/* Progress / Status Display */}
            {bulkVillageProgress && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center gap-3 text-sm animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                <span>
                  {locale === 'ta' ? 'சேமிக்கப்படுகிறது:' : 'Saving:'}{' '}
                  <strong>{bulkVillageProgress.currentName}</strong> ({bulkVillageProgress.current} /{' '}
                  {bulkVillageProgress.total})...
                </span>
              </div>
            )}

            {/* Results / Error Display */}
            {bulkVillageResult && (
              <div
                className={`p-3.5 rounded-xl border text-sm space-y-1.5 ${
                  bulkVillageResult.failed === 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {bulkVillageResult.failed === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  <span>
                    {bulkVillageResult.success}{' '}
                    {locale === 'ta' ? 'கிராமங்கள் வெற்றிகரமாக சேர்க்கப்பட்டன!' : 'villages added successfully!'}
                    {bulkVillageResult.failed > 0 && ` (${bulkVillageResult.failed} failed)`}
                  </span>
                </div>
                {bulkVillageResult.errors.length > 0 && (
                  <ul className="text-xs list-disc pl-5 text-red-600 dark:text-red-400 space-y-0.5">
                    {bulkVillageResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={bulkVillageSubmitting}
              onClick={() => setIsBulkVillageDialogOpen(false)}
              className="h-10.5 px-4 rounded-xl text-sm font-bold cursor-pointer"
            >
              {locale === 'ta' ? 'ரத்து' : 'Cancel'}
            </Button>
            <Button
              type="button"
              disabled={
                bulkVillageSubmitting ||
                !bulkVillagePanchayatId ||
                bulkVillageRows.filter((r) => r.name.trim()).length === 0
              }
              onClick={handleSaveBulkVillages}
              className="bg-gradient-to-r from-[#8F0A1B] to-[#B81930] hover:opacity-95 text-white font-bold h-10.5 px-5 rounded-xl text-sm flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {bulkVillageSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{locale === 'ta' ? 'சேமிக்கிறது...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {locale === 'ta' ? 'அனைத்தையும் சேர்க்க' : 'Add All'}{' '}
                    ({bulkVillageRows.filter((r) => r.name.trim()).length})
                  </span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Coordinate Picker Modal */}
      <MapCoordinatePickerModal
        isOpen={mapPickerState.isOpen}
        onClose={() => setMapPickerState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmMapPicker}
        initialLat={mapPickerState.lat}
        initialLng={mapPickerState.lng}
        title={mapPickerState.title}
        subtitle={mapPickerState.subtitle}
        locale={locale}
        entityType={mapPickerState.entityType}
      />

    </div>
  );
}
