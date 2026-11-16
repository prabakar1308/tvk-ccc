'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Upload, FileText, X, Camera, AlertCircle, Check, ChevronsUpDown, Trash2, CreditCard } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import { CreateCadreDto } from '@/services/api/cadres';
import { uploadApi } from '@/services/api/upload';
import { useCreateCadre, useUpdateCadre } from '@/hooks/use-cadres';
import { useDistricts } from '@/hooks/use-districts';
import { useUnions } from '@/hooks/use-unions';
import { useKilais } from '@/hooks/use-kilais';
import { usePanchayats } from '@/hooks/use-panchayats';
import { useVillages } from '@/hooks/use-villages';
import { BoothMultiSelect } from '@/components/shared/booth-multi-select';

export interface CadreFormData {
  name: string;
  memberId: string;
  phone?: string | null;
  role?: string | null;
  level: 'DISTRICT' | 'GROUP' | 'UNION' | 'KILAI';
  districtId?: string | null;
  unionId?: string | null;
  homeKilaiId?: string | null;
  aadhaarNumber?: string | null;
  voterId?: string | null;
  photoUrl?: string | null;
  attachments?: { 
    aadhaarPhoto?: string; 
    voterIdPhoto?: string; 
    membershipCard?: string;
  };
  panchayat?: string | null;
  village?: string | null;
  dateOfBirth?: string | null;
  remarks?: string | null;
  area?: string | null;
  boothNo?: string | null;
  wingId?: string | null;
}

export interface CadreFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingId?: string | null;
  cadres?: any[]; // list of existing cadres (needed to find the one being edited)
  defaultLevel?: 'KILAI' | 'UNION' | 'DISTRICT' | 'GROUP';
  lockLevel?: boolean;
  defaultDistrictId?: string;
  defaultUnionId?: string;
  defaultKilaiId?: string;
  defaultBoothNo?: string;
  defaultPanchayat?: string;
  defaultVillage?: string;
  defaultArea?: string;
  defaultWingId?: string;
  defaultRole?: string;
  onSuccess?: () => void;
}

export function CadreFormDialog({
  isOpen,
  onOpenChange,
  editingId,
  cadres = [],
  defaultLevel = 'DISTRICT',
  lockLevel = false,
  defaultDistrictId,
  defaultUnionId,
  defaultKilaiId,
  defaultBoothNo,
  defaultPanchayat,
  defaultVillage,
  defaultArea,
  defaultWingId,
  defaultRole,
  onSuccess,
}: CadreFormDialogProps) {
  const createMutation = useCreateCadre();
  const updateMutation = useUpdateCadre();
  
  const { data: districts = [] } = useDistricts();
  const { data: unions = [] } = useUnions();
  const { data: kilais = [] } = useKilais();


  const initialFormData: CadreFormData = {
    name: '',
    memberId: '',
    phone: '',
    role: defaultRole || '',
    level: defaultLevel,
    districtId: defaultDistrictId || (districts.length > 0 ? districts[0].id : undefined),
    unionId: defaultUnionId,
    homeKilaiId: defaultKilaiId,
    aadhaarNumber: '',
    voterId: '',
    photoUrl: '',
    attachments: { aadhaarPhoto: '', voterIdPhoto: '', membershipCard: '' },
    panchayat: defaultPanchayat || defaultArea || '',
    village: defaultVillage || '',
    dateOfBirth: '',
    remarks: '',
    area: defaultArea || '',
    boothNo: defaultBoothNo || '',
    wingId: defaultWingId,
  };

  const [formData, setFormData] = useState<CadreFormData>(initialFormData);

  const filteredKilais = kilais.filter((k: any) => k.unionId === formData.unionId);

  // Panchayats and Villages resolution
  const { data: dbPanchayats = [] } = usePanchayats(formData.unionId || undefined);

  const [isPanchayatOpen, setIsPanchayatOpen] = useState(false);
  const [panchayatSearch, setPanchayatSearch] = useState('');
  const [isVillageOpen, setIsVillageOpen] = useState(false);
  const [villageSearch, setVillageSearch] = useState('');

  const availablePanchayats = useMemo(() => {
    const map = new Map<string, { id?: string; name: string; nameTa?: string }>();
    (dbPanchayats || []).forEach((p: any) => {
      if (p.name) {
        map.set(p.name.trim().toLowerCase(), {
          id: p.id,
          name: p.name.trim(),
          nameTa: p.nameTa?.trim() || undefined,
        });
      }
    });

    const currentUnion = unions.find((u: any) => String(u.id || u._id) === formData.unionId);
    (currentUnion?.areasCovered || []).forEach((a: string) => {
      const key = a.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: a.trim() });
      }
    });

    return Array.from(map.values());
  }, [dbPanchayats, unions, formData.unionId]);

  const matchedPanchayat = useMemo(() => {
    if (!formData.panchayat) return null;
    const pLow = formData.panchayat.trim().toLowerCase();
    return availablePanchayats.find((p) => p.name.toLowerCase() === pLow);
  }, [availablePanchayats, formData.panchayat]);

  const { data: dbVillages = [] } = useVillages(matchedPanchayat?.id || undefined);

  const availableVillages = useMemo(() => {
    const map = new Map<string, { id?: string; name: string; nameTa?: string }>();
    (dbVillages || []).forEach((v: any) => {
      if (v.name) {
        map.set(v.name.trim().toLowerCase(), {
          id: v.id,
          name: v.name.trim(),
          nameTa: v.nameTa?.trim() || undefined,
        });
      }
    });

    const currentKilai = kilais.find((k: any) => String(k.id || k._id) === formData.homeKilaiId);
    (currentKilai?.villages || []).forEach((v: string) => {
      const key = v.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: v.trim() });
      }
    });

    return Array.from(map.values());
  }, [dbVillages, kilais, formData.homeKilaiId]);

  const [pendingFiles, setPendingFiles] = useState<{
    photo?: File;
    aadhaarPhoto?: File;
    voterIdPhoto?: File;
    membershipCard?: File;
  }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);



  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (editingId) {
        const cadre = cadres.find((c) => c.id === editingId);
        if (cadre) {
          setFormData({
            name: cadre.name || '',
            memberId: cadre.memberId || '',
            phone: cadre.phone || '',
            role: cadre.role || '',
            level: cadre.level || defaultLevel,
            districtId: (cadre.districtId || defaultDistrictId || (districts.length > 0 ? districts[0].id : '')) || undefined,
            unionId: cadre.unionId || defaultUnionId || undefined,
            homeKilaiId: cadre.homeKilaiId || defaultKilaiId || undefined,
            wingId: cadre.wingId || defaultWingId || undefined,
            aadhaarNumber: cadre.aadhaarNumber || '',
            voterId: cadre.voterId || '',
            photoUrl: cadre.photoUrl || '',
            attachments: cadre.attachments || { aadhaarPhoto: '', voterIdPhoto: '', membershipCard: '' },
            panchayat: cadre.panchayat || cadre.area || '',
            village: cadre.village || '',
            dateOfBirth: cadre.dateOfBirth || cadre.dob || '',
            remarks: cadre.remarks || '',
            area: cadre.area || '',
            boothNo: cadre.boothNo || '',
          });
        }
      } else {
        setFormData({ 
          ...initialFormData, 
          level: defaultLevel, 
          districtId: defaultDistrictId || (districts.length > 0 ? districts[0].id : undefined),
          unionId: defaultUnionId, 
          homeKilaiId: defaultKilaiId,
          boothNo: defaultBoothNo || '',
          panchayat: defaultPanchayat || defaultArea || '',
          village: defaultVillage || '',
          dateOfBirth: '',
          remarks: '',
          area: defaultArea || '',
          wingId: defaultWingId,
          role: defaultRole || '',
          voterId: '',
          attachments: { aadhaarPhoto: '', voterIdPhoto: '', membershipCard: '' },
        } as any);
      }
      setPendingFiles({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingId]);

  useEffect(() => {
    if (isOpen && !formData.districtId && districts.length > 0 && formData.level === 'DISTRICT') {
      setFormData((prev) => ({
        ...prev,
        districtId: defaultDistrictId || districts[0].id,
      }));
    }
  }, [isOpen, districts, formData.level, formData.districtId, defaultDistrictId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Client-Side Pre-validation
    const trimmedName = formData.name?.trim();
    const trimmedMemberId = formData.memberId?.trim();
    const trimmedPhone = formData.phone?.trim();
    const trimmedAadhaar = formData.aadhaarNumber?.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter the administrator's name.");
      return;
    }
    if (!trimmedMemberId) {
      setErrorMessage("Please enter the Member ID / Voter ID.");
      return;
    }
    if (!trimmedPhone) {
      setErrorMessage("Please enter the phone number.");
      return;
    }
    if (!formData.role) {
      setErrorMessage("Please select a Designation.");
      return;
    }
    if (formData.level === 'DISTRICT' && !formData.districtId) {
      setErrorMessage("Please select a District.");
      return;
    }
    if ((formData.level === 'UNION' || formData.level === 'KILAI') && !formData.unionId) {
      setErrorMessage("Please select a Union.");
      return;
    }
    if (formData.level === 'KILAI' && !formData.homeKilaiId) {
      setErrorMessage("Please select a Kilai.");
      return;
    }
    if (!trimmedAadhaar) {
      setErrorMessage("Please enter the Aadhaar Number.");
      return;
    }

    setIsUploading(true);
    const newlyUploadedUrls: string[] = [];

    try {
      let photoUrl = formData.photoUrl;
      let aadhaarPhoto = formData.attachments?.aadhaarPhoto;
      let voterIdPhoto = formData.attachments?.voterIdPhoto;
      let membershipCard = formData.attachments?.membershipCard;

      if (pendingFiles.photo) {
        const res = await uploadApi.uploadFile(pendingFiles.photo);
        photoUrl = res.url;
        newlyUploadedUrls.push(res.url);
      }
      if (pendingFiles.membershipCard) {
        const res = await uploadApi.uploadFile(pendingFiles.membershipCard);
        membershipCard = res.url;
        newlyUploadedUrls.push(res.url);
      }
      if (pendingFiles.aadhaarPhoto) {
        const res = await uploadApi.uploadFile(pendingFiles.aadhaarPhoto);
        aadhaarPhoto = res.url;
        newlyUploadedUrls.push(res.url);
      }
      if (pendingFiles.voterIdPhoto) {
        const res = await uploadApi.uploadFile(pendingFiles.voterIdPhoto);
        voterIdPhoto = res.url;
        newlyUploadedUrls.push(res.url);
      }

      const cleanMemberId = trimmedMemberId;
      const cleanVoterId = cleanMemberId;

      const finalData: any = {
        ...formData,
        name: trimmedName,
        memberId: cleanMemberId,
        voterId: cleanVoterId,
        phone: trimmedPhone || undefined,
        aadhaarNumber: trimmedAadhaar || undefined,
        photoUrl: photoUrl || undefined,
        districtId: formData.level === 'DISTRICT' ? (formData.districtId || undefined) : (editingId ? null : undefined),
        unionId: (formData.level === 'UNION' || formData.level === 'KILAI') ? (formData.unionId || undefined) : (editingId ? null : undefined),
        homeKilaiId: formData.level === 'KILAI' ? (formData.homeKilaiId || undefined) : (editingId ? null : undefined),
        panchayat: formData.panchayat?.trim() || null,
        village: formData.village?.trim() || null,
        dateOfBirth: formData.dateOfBirth?.trim() || null,
        dob: formData.dateOfBirth?.trim() || null,
        remarks: formData.remarks?.trim() || null,
        area: [formData.panchayat?.trim(), formData.village?.trim()].filter(Boolean).join(', ') || formData.area || null,
        attachments: {
          aadhaarPhoto: aadhaarPhoto || undefined,
          voterIdPhoto: voterIdPhoto || undefined,
          membershipCard: membershipCard || undefined,
        }
      };

      // Remove undefined properties to avoid issues with some APIs
      Object.keys(finalData).forEach(key => finalData[key] === undefined && delete finalData[key]);

      if (editingId) {
        const originalCadre = cadres?.find(c => c.id === editingId);
        await updateMutation.mutateAsync({ id: editingId, data: finalData });

        if (pendingFiles.photo && originalCadre?.photoUrl) {
          uploadApi.deleteFile(originalCadre.photoUrl).catch(console.error);
        }
        if (pendingFiles.membershipCard && originalCadre?.attachments?.membershipCard) {
          uploadApi.deleteFile(originalCadre.attachments.membershipCard).catch(console.error);
        }
        if (pendingFiles.aadhaarPhoto && originalCadre?.attachments?.aadhaarPhoto) {
          uploadApi.deleteFile(originalCadre.attachments.aadhaarPhoto).catch(console.error);
        }
        if (pendingFiles.voterIdPhoto && originalCadre?.attachments?.voterIdPhoto) {
          uploadApi.deleteFile(originalCadre.attachments.voterIdPhoto).catch(console.error);
        }

        setErrorMessage(null);
        onOpenChange(false);
        onSuccess?.();
      } else {
        await createMutation.mutateAsync(finalData);
        setErrorMessage(null);
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error("Error submitting cadre form", error);

      // Clean up newly uploaded files on error so orphaned files don't linger
      for (const url of newlyUploadedUrls) {
        uploadApi.deleteFile(url).catch(console.error);
      }

      const serverMsg = error?.response?.data?.message;
      const displayMsg = Array.isArray(serverMsg)
        ? serverMsg.join(', ')
        : (serverMsg || error?.message || (editingId ? "Failed to update administrator. Please try again." : "Failed to register administrator. Please try again."));

      setErrorMessage(displayMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Administrator' : 'Register New Administrator'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-xs tracking-wide uppercase">
                  {editingId ? 'Update Failed' : 'Registration Failed'}
                </p>
                <p className="mt-0.5 leading-relaxed font-medium">{errorMessage}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setErrorMessage(null)} 
                className="text-destructive hover:opacity-70 p-1 rounded-md"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name" 
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone No *</Label>
              <Input 
                id="phone" 
                placeholder="Mobile number"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
              <p className="text-[10.5px] text-muted-foreground">Same number can be used for multiple cadres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberId">Member ID / Voter ID *</Label>
              <Input 
                id="memberId" 
                placeholder="e.g. ZZG-1234567"
                value={formData.memberId}
                onChange={(e) => setFormData({...formData, memberId: e.target.value, voterId: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aadhaar">Aadhaar No *</Label>
              <Input 
                id="aadhaar" 
                placeholder="12-digit Aadhaar number"
                value={formData.aadhaarNumber || ''}
                onChange={(e) => setFormData({...formData, aadhaarNumber: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level *</Label>
              <Select 
                value={formData.level} 
                onValueChange={(val: any) => {
                  setFormData(prev => ({
                    ...prev,
                    level: val,
                    districtId: val === 'DISTRICT' ? (prev.districtId || defaultDistrictId || (districts[0]?.id ?? '')) : undefined,
                    unionId: (val === 'UNION' || val === 'KILAI') ? (prev.unionId || defaultUnionId || '') : undefined,
                    homeKilaiId: val === 'KILAI' ? (prev.homeKilaiId || defaultKilaiId || '') : undefined,
                  }));
                }}
                disabled={lockLevel}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISTRICT">District</SelectItem>
                  {/* <SelectItem value="GROUP">Group</SelectItem> */}
                  <SelectItem value="UNION">Union</SelectItem>
                  <SelectItem value="KILAI">Kilai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.level === 'DISTRICT' && districts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="districtId">District *</Label>
                <Select 
                  value={formData.districtId || ''} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, districtId: val }))}
                  required
                  disabled={!!defaultDistrictId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select district">
                      {formData.districtId ? districts.find((d: any) => String(d.id) === formData.districtId)?.name : "Select district"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(formData.level === 'UNION' || formData.level === 'KILAI') && (
              <div className="space-y-2">
                <Label htmlFor="unionId">Union *</Label>
                <Select 
                  key={`union-${unions.length}`}
                  value={formData.unionId || ''}
                  onValueChange={(val) => {
                    const selectedUnion = unions.find((u: any) => String(u.id || u._id) === val);
                    setFormData(prev => ({
                      ...prev, 
                      unionId: val, 
                      homeKilaiId: '',
                      districtId: selectedUnion?.districtId || prev.districtId,
                    } as any));
                  }}
                  disabled={!!defaultUnionId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select union">
                      {formData.unionId ? unions.find((u: any) => String(u.id || u._id) === formData.unionId)?.name : "Select union"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {unions.map((u: any) => (
                      <SelectItem key={u.id || u._id} value={String(u.id || u._id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.level === 'KILAI' && (
              <div className="space-y-2">
                <Label htmlFor="homeKilaiId">Kilai *</Label>
                <Select 
                  key={`kilai-${filteredKilais.length}`}
                  value={formData.homeKilaiId || ''} 
                  onValueChange={(val) => setFormData(prev => ({...prev, homeKilaiId: val} as any))}
                  required
                  disabled={!formData.unionId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={formData.unionId ? "Select kilai" : "Select union first"}>
                      {formData.homeKilaiId ? filteredKilais.find((k: any) => String(k.id || k._id) === formData.homeKilaiId)?.name : (formData.unionId ? "Select kilai" : "Select union first")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredKilais.map((k: any) => (
                      <SelectItem key={k.id || k._id} value={String(k.id || k._id)}>
                        {k.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="role">Designation *</Label>
              <Select 
                value={formData.role || ''} 
                onValueChange={(val) => setFormData({...formData, role: val || ''} as any)}
                required
                disabled={!!defaultWingId && !!defaultRole}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {defaultWingId ? (
                    <>
                      <SelectItem value="COORDINATOR">Coordinator</SelectItem>
                      <SelectItem value="CO_COORDINATOR">Co-coordinator</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Secretary">Secretary</SelectItem>
                      <SelectItem value="Joint Secretary">Joint Secretary</SelectItem>
                      <SelectItem value="Treasurer">Treasurer</SelectItem>
                      <SelectItem value="Deputy Secretary">Deputy Secretary</SelectItem>
                      <SelectItem value="Executive Committee Member">Executive Committee Member</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
              </Label>
              <Input 
                id="dateOfBirth" 
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-2 flex flex-col">
              <Label htmlFor="panchayat">Panchayat</Label>
              <Popover open={isPanchayatOpen} onOpenChange={setIsPanchayatOpen}>
                <PopoverTrigger
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground font-normal"
                >
                  <span className={formData.panchayat ? "text-foreground font-medium truncate" : "text-muted-foreground truncate"}>
                    {formData.panchayat || "Select or enter panchayat"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {formData.panchayat && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData((prev) => ({ ...prev, panchayat: '', village: '' }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            setFormData((prev) => ({ ...prev, panchayat: '', village: '' }));
                          }
                        }}
                        className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Clear"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or type panchayat..."
                      value={panchayatSearch}
                      onValueChange={setPanchayatSearch}
                    />
                    <CommandList className="max-h-52">
                      <CommandEmpty>
                        <div className="p-2 text-center text-xs">
                          {panchayatSearch ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, panchayat: panchayatSearch }));
                                setIsPanchayatOpen(false);
                                setPanchayatSearch('');
                              }}
                            >
                              Use "{panchayatSearch}"
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">Type to enter a custom panchayat.</span>
                          )}
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {panchayatSearch &&
                          !availablePanchayats.some(
                            (p) => p.name.toLowerCase() === panchayatSearch.toLowerCase()
                          ) && (
                            <CommandItem
                              value={`custom-${panchayatSearch}`}
                              onSelect={() => {
                                setFormData((prev) => ({ ...prev, panchayat: panchayatSearch }));
                                setIsPanchayatOpen(false);
                                setPanchayatSearch('');
                              }}
                              className="text-primary font-medium"
                            >
                              + Use "{panchayatSearch}"
                            </CommandItem>
                          )}
                        {availablePanchayats.map((p) => {
                          const isSelected =
                            formData.panchayat?.toLowerCase() === p.name.toLowerCase();
                          return (
                            <CommandItem
                              key={p.name}
                              value={`${p.name} ${p.nameTa || ''}`}
                              onSelect={() => {
                                setFormData((prev) => ({ ...prev, panchayat: p.name }));
                                setIsPanchayatOpen(false);
                                setPanchayatSearch('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{p.name}</span>
                              {p.nameTa && (
                                <span className="ml-1.5 text-xs text-muted-foreground truncate">
                                  ({p.nameTa})
                                </span>
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 flex flex-col">
              <Label htmlFor="village">Village</Label>
              <Popover open={isVillageOpen} onOpenChange={setIsVillageOpen}>
                <PopoverTrigger
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground font-normal"
                >
                  <span className={formData.village ? "text-foreground font-medium truncate" : "text-muted-foreground truncate"}>
                    {formData.village || "Select or enter village"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {formData.village && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData((prev) => ({ ...prev, village: '' }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            setFormData((prev) => ({ ...prev, village: '' }));
                          }
                        }}
                        className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Clear"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or type village..."
                      value={villageSearch}
                      onValueChange={setVillageSearch}
                    />
                    <CommandList className="max-h-52">
                      <CommandEmpty>
                        <div className="p-2 text-center text-xs">
                          {villageSearch ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, village: villageSearch }));
                                setIsVillageOpen(false);
                                setVillageSearch('');
                              }}
                            >
                              Use "{villageSearch}"
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">Type to enter a custom village.</span>
                          )}
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {villageSearch &&
                          !availableVillages.some(
                            (v) => v.name.toLowerCase() === villageSearch.toLowerCase()
                          ) && (
                            <CommandItem
                              value={`custom-${villageSearch}`}
                              onSelect={() => {
                                setFormData((prev) => ({ ...prev, village: villageSearch }));
                                setIsVillageOpen(false);
                                setVillageSearch('');
                              }}
                              className="text-primary font-medium"
                            >
                              + Use "{villageSearch}"
                            </CommandItem>
                          )}
                        {availableVillages.map((v) => {
                          const isSelected =
                            formData.village?.toLowerCase() === v.name.toLowerCase();
                          return (
                            <CommandItem
                              key={v.name}
                              value={`${v.name} ${v.nameTa || ''}`}
                              onSelect={() => {
                                setFormData((prev) => ({ ...prev, village: v.name }));
                                setIsVillageOpen(false);
                                setVillageSearch('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{v.name}</span>
                              {v.nameTa && (
                                <span className="ml-1.5 text-xs text-muted-foreground truncate">
                                  ({v.nameTa})
                                </span>
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="col-span-2 space-y-2 flex flex-col">
              <Label>Booth</Label>
              <BoothMultiSelect
                value={formData.boothNo ? formData.boothNo.split(',').map((s) => s.trim()).filter(Boolean) : []}
                onChange={(val) => setFormData((prev) => ({ ...prev, boothNo: val.join(', ') }))}
                displayStyle="badges"
              />
            </div>

            <div className="col-span-2 space-y-2 flex flex-col">
              <Label htmlFor="remarks">
                Remarks <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="remarks"
                placeholder="Enter any additional remarks..."
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t space-y-5">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Photo & Verification Documents</h3>

            {/* Prominent Profile Avatar Uploader with Camera & Gallery Access */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-zinc-50 to-primary/10 dark:from-primary/10 dark:via-zinc-900 dark:to-primary/5 border border-primary/15 shadow-sm flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <UserAvatar
                  src={formData.photoUrl}
                  name={formData.name || 'Admin'}
                  size="2xl"
                  ring="primary"
                  elevation="glow"
                />
                {formData.photoUrl && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPendingFiles(prev => ({...prev, photo: undefined}));
                      setFormData(prev => ({...prev, photoUrl: ''}));
                      const elCam = document.getElementById('photo-camera') as HTMLInputElement;
                      if (elCam) elCam.value = '';
                      const elGal = document.getElementById('photo-gallery') as HTMLInputElement;
                      if (elGal) elGal.value = '';
                    }}
                    className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-colors z-20"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Hidden Inputs for Camera (Mobile capture) and Gallery */}
              <input 
                id="photo-camera" 
                type="file" 
                accept="image/*"
                capture="environment"
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPendingFiles(prev => ({...prev, photo: file}));
                    setFormData(prev => ({...prev, photoUrl: URL.createObjectURL(file)}));
                  }
                  e.target.value = '';
                }}
              />
              <input 
                id="photo-gallery" 
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPendingFiles(prev => ({...prev, photo: file}));
                    setFormData(prev => ({...prev, photoUrl: URL.createObjectURL(file)}));
                  }
                  e.target.value = '';
                }}
              />

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  <span className="text-base font-bold text-gray-900 dark:text-zinc-100">
                    Administrator Profile Photo
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use your mobile camera directly to take a portrait photo, or select from your gallery.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <label 
                    htmlFor="photo-camera" 
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-3.5 py-1.5 rounded-lg cursor-pointer shadow-xs transition-colors"
                    title="Take photo using mobile camera"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Camera</span>
                  </label>
                  <label 
                    htmlFor="photo-gallery" 
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                    title="Choose photo from device gallery"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Gallery</span>
                  </label>
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFiles(prev => ({ ...prev, photo: undefined }));
                        setFormData(prev => ({ ...prev, photoUrl: '' }));
                        const elCam = document.getElementById('photo-camera') as HTMLInputElement;
                        if (elCam) elCam.value = '';
                        const elGal = document.getElementById('photo-gallery') as HTMLInputElement;
                        if (elGal) elGal.value = '';
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:text-destructive/80 px-2 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Documents: TVK Membership Card, Aadhaar, Voter ID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* TVK Membership Card */}
              <div className="space-y-1.5">
                <Label className="text-center block w-full text-xs font-semibold text-gray-800 dark:text-zinc-200">
                  TVK Membership Card
                </Label>
                <div className="relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group overflow-hidden bg-gray-50 dark:bg-zinc-900/50">
                  {formData.attachments?.membershipCard ? (
                    <>
                      {formData.attachments.membershipCard.includes('blob:') || formData.attachments.membershipCard.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <img src={formData.attachments.membershipCard} alt="TVK Membership Card" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-muted">
                          <FileText className="w-8 h-8 text-primary mb-1" />
                          <span className="text-[10px] font-bold text-muted-foreground">PDF / Document</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label htmlFor="membershipCard-camera" className="cursor-pointer p-2 bg-white/90 hover:bg-white text-primary rounded-full shadow-md transition-transform hover:scale-110" title="Retake with camera">
                          <Camera className="w-4 h-4" />
                        </label>
                        <label htmlFor="membershipCard-file" className="cursor-pointer p-2 bg-white/90 hover:bg-white text-zinc-800 rounded-full shadow-md transition-transform hover:scale-110" title="Upload from files">
                          <Upload className="w-4 h-4" />
                        </label>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPendingFiles(prev => ({...prev, membershipCard: undefined}));
                          setFormData(prev => ({...prev, attachments: { ...prev.attachments, membershipCard: '' } as any}));
                          const el = document.getElementById('membershipCard-file') as HTMLInputElement;
                          if (el) el.value = '';
                          const elCam = document.getElementById('membershipCard-camera') as HTMLInputElement;
                          if (elCam) elCam.value = '';
                        }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors z-10"
                        title="Remove Card"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary p-2 text-center">
                      <CreditCard className="w-6 h-6 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[11px] font-semibold">TVK Membership Card</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <label 
                          htmlFor="membershipCard-camera" 
                          className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md transition-colors"
                          title="Capture with camera"
                        >
                          <Camera className="w-3 h-3" /> Camera
                        </label>
                        <label 
                          htmlFor="membershipCard-file" 
                          className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded-md transition-colors"
                          title="Choose from files"
                        >
                          <Upload className="w-3 h-3" /> File
                        </label>
                      </div>
                    </div>
                  )}
                  <input 
                    id="membershipCard-camera" 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPendingFiles(prev => ({...prev, membershipCard: file}));
                        setFormData(prev => ({...prev, attachments: { ...prev.attachments, membershipCard: URL.createObjectURL(file) }}));
                      }
                      e.target.value = '';
                    }}
                  />
                  <input 
                    id="membershipCard-file" 
                    type="file" 
                    accept="image/*,application/pdf"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPendingFiles(prev => ({...prev, membershipCard: file}));
                        setFormData(prev => ({...prev, attachments: { ...prev.attachments, membershipCard: URL.createObjectURL(file) }}));
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              {/* Aadhaar Photo */}
              <div className="space-y-1.5">
                <Label className="text-center block w-full text-xs font-semibold text-gray-800 dark:text-zinc-200">
                  Aadhaar Card
                </Label>
                <div className="relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group overflow-hidden bg-gray-50 dark:bg-zinc-900/50">
                  {formData.attachments?.aadhaarPhoto ? (
                    <>
                      {formData.attachments.aadhaarPhoto.includes('blob:') || formData.attachments.aadhaarPhoto.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <img src={formData.attachments.aadhaarPhoto} alt="Aadhaar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-muted">
                          <FileText className="w-8 h-8 text-primary mb-1" />
                          <span className="text-[10px] font-bold text-muted-foreground">PDF / Document</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label htmlFor="aadhaarPhoto-camera" className="cursor-pointer p-2 bg-white/90 hover:bg-white text-primary rounded-full shadow-md transition-transform hover:scale-110" title="Retake with camera">
                          <Camera className="w-4 h-4" />
                        </label>
                        <label htmlFor="aadhaarPhoto" className="cursor-pointer p-2 bg-white/90 hover:bg-white text-zinc-800 rounded-full shadow-md transition-transform hover:scale-110" title="Upload from files">
                          <Upload className="w-4 h-4" />
                        </label>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPendingFiles(prev => ({...prev, aadhaarPhoto: undefined}));
                          setFormData(prev => ({...prev, attachments: { ...prev.attachments, aadhaarPhoto: '' } as any}));
                          const el = document.getElementById('aadhaarPhoto') as HTMLInputElement;
                          if (el) el.value = '';
                          const elCam = document.getElementById('aadhaarPhoto-camera') as HTMLInputElement;
                          if (elCam) elCam.value = '';
                        }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors z-10"
                        title="Remove Aadhaar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary p-2 text-center">
                      <CreditCard className="w-6 h-6 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[11px] font-semibold">Aadhaar Card</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <label 
                          htmlFor="aadhaarPhoto-camera" 
                          className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md transition-colors"
                          title="Capture with camera"
                        >
                          <Camera className="w-3 h-3" /> Camera
                        </label>
                        <label 
                          htmlFor="aadhaarPhoto" 
                          className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded-md transition-colors"
                          title="Choose from files"
                        >
                          <Upload className="w-3 h-3" /> File
                        </label>
                      </div>
                    </div>
                  )}
                  <input 
                    id="aadhaarPhoto-camera" 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPendingFiles(prev => ({...prev, aadhaarPhoto: file}));
                        setFormData(prev => ({...prev, attachments: { ...prev.attachments, aadhaarPhoto: URL.createObjectURL(file) }}));
                      }
                      e.target.value = '';
                    }}
                  />
                  <input 
                    id="aadhaarPhoto" 
                    type="file" 
                    accept="image/*,application/pdf"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPendingFiles({...pendingFiles, aadhaarPhoto: file});
                        setFormData({...formData, attachments: { ...formData.attachments, aadhaarPhoto: URL.createObjectURL(file) }});
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              {/* Voter ID Photo */}
              <div className="space-y-1.5">
                <Label className="text-center block w-full text-xs font-semibold text-gray-800 dark:text-zinc-200">
                  Voter ID Card
                </Label>
                <div className="relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group overflow-hidden bg-gray-50 dark:bg-zinc-900/50">
                  {formData.attachments?.voterIdPhoto ? (
                    <>
                      {formData.attachments.voterIdPhoto.includes('blob:') || formData.attachments.voterIdPhoto.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <img src={formData.attachments.voterIdPhoto} alt="Voter ID" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-muted">
                          <FileText className="w-8 h-8 text-primary mb-1" />
                          <span className="text-[10px] font-bold text-muted-foreground">PDF / Document</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label htmlFor="voterIdPhoto-camera" className="cursor-pointer p-2 bg-white/90 hover:bg-white text-primary rounded-full shadow-md transition-transform hover:scale-110" title="Retake with camera">
                          <Camera className="w-4 h-4" />
                        </label>
                        <label htmlFor="voterIdPhoto" className="cursor-pointer p-2 bg-white/90 hover:bg-white text-zinc-800 rounded-full shadow-md transition-transform hover:scale-110" title="Upload from files">
                          <Upload className="w-4 h-4" />
                        </label>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPendingFiles(prev => ({...prev, voterIdPhoto: undefined}));
                          setFormData(prev => ({...prev, attachments: { ...prev.attachments, voterIdPhoto: '' } as any}));
                          const el = document.getElementById('voterIdPhoto') as HTMLInputElement;
                          if (el) el.value = '';
                          const elCam = document.getElementById('voterIdPhoto-camera') as HTMLInputElement;
                          if (elCam) elCam.value = '';
                        }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors z-10"
                        title="Remove Voter ID"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary p-2 text-center">
                      <CreditCard className="w-6 h-6 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[11px] font-semibold">Voter ID Card</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <label 
                          htmlFor="voterIdPhoto-camera" 
                          className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md transition-colors"
                          title="Capture with camera"
                        >
                          <Camera className="w-3 h-3" /> Camera
                        </label>
                        <label 
                          htmlFor="voterIdPhoto" 
                          className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded-md transition-colors"
                          title="Choose from files"
                        >
                          <Upload className="w-3 h-3" /> File
                        </label>
                      </div>
                    </div>
                  )}
                  <input 
                    id="voterIdPhoto-camera" 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPendingFiles(prev => ({...prev, voterIdPhoto: file}));
                        setFormData(prev => ({...prev, attachments: { ...prev.attachments, voterIdPhoto: URL.createObjectURL(file) }}));
                      }
                      e.target.value = '';
                    }}
                  />
                  <input 
                    id="voterIdPhoto" 
                    type="file" 
                    accept="image/*,application/pdf"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPendingFiles({...pendingFiles, voterIdPhoto: file});
                        setFormData({...formData, attachments: { ...formData.attachments, voterIdPhoto: URL.createObjectURL(file) }});
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || isUploading}>
              {isUploading ? 'Uploading...' : editingId ? 'Save Changes' : 'Register Administrator'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
