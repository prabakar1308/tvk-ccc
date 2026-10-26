'use client';

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, Camera, AlertCircle } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import { CreateCadreDto } from '@/services/api/cadres';
import { uploadApi } from '@/services/api/upload';
import { useCreateCadre, useUpdateCadre } from '@/hooks/use-cadres';
import { useDistricts } from '@/hooks/use-districts';
import { useUnions } from '@/hooks/use-unions';
import { useKilais } from '@/hooks/use-kilais';
import { AreaMultiSelect } from '@/components/shared/area-multi-select';
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
  attachments?: { aadhaarPhoto?: string; voterIdPhoto?: string };
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
    photoUrl: '',
    attachments: { aadhaarPhoto: '', voterIdPhoto: '' },
    area: defaultArea || '',
    boothNo: defaultBoothNo || '',
    wingId: defaultWingId,
  };

  const [formData, setFormData] = useState<CadreFormData>(initialFormData);

  const filteredKilais = kilais.filter((k: any) => k.unionId === formData.unionId);

  const [pendingFiles, setPendingFiles] = useState<{
    photo?: File;
    aadhaarPhoto?: File;
    voterIdPhoto?: File;
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
            attachments: cadre.attachments || { aadhaarPhoto: '', voterIdPhoto: '' },
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
          area: defaultArea || '',
          wingId: defaultWingId,
          role: defaultRole || '',
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

      if (pendingFiles.photo) {
        const res = await uploadApi.uploadFile(pendingFiles.photo);
        photoUrl = res.url;
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
      const cleanVoterId = formData.voterId?.trim() || (!cleanMemberId.startsWith('TVK-') ? cleanMemberId : undefined);

      const finalData: any = {
        ...formData,
        name: trimmedName,
        memberId: cleanMemberId,
        voterId: cleanVoterId || undefined,
        phone: trimmedPhone || undefined,
        aadhaarNumber: trimmedAadhaar || undefined,
        photoUrl: photoUrl || undefined,
        districtId: formData.level === 'DISTRICT' ? (formData.districtId || undefined) : (editingId ? null : undefined),
        unionId: (formData.level === 'UNION' || formData.level === 'KILAI') ? (formData.unionId || undefined) : (editingId ? null : undefined),
        homeKilaiId: formData.level === 'KILAI' ? (formData.homeKilaiId || undefined) : (editingId ? null : undefined),
        attachments: {
          aadhaarPhoto: aadhaarPhoto || undefined,
          voterIdPhoto: voterIdPhoto || undefined,
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
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberId">Member ID / Voter ID *</Label>
              <Input 
                id="memberId" 
                value={formData.memberId}
                onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone No *</Label>
              <Input 
                id="phone" 
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
              <Label htmlFor="aadhaar">Aadhaar No *</Label>
              <Input 
                id="aadhaar" 
                value={formData.aadhaarNumber || ''}
                onChange={(e) => setFormData({...formData, aadhaarNumber: e.target.value})}
                required
              />
            </div>
            <div className="col-span-2 space-y-2 flex flex-col">
              <Label>Area</Label>
              <AreaMultiSelect
                value={formData.area ? formData.area.split(',').map((s) => s.trim()).filter(Boolean) : []}
                onChange={(val) => setFormData((prev) => ({ ...prev, area: val.join(', ') }))}
                displayStyle="badges"
              />
            </div>
            <div className="col-span-2 space-y-2 flex flex-col">
              <Label>Booth</Label>
              <BoothMultiSelect
                value={formData.boothNo ? formData.boothNo.split(',').map((s) => s.trim()).filter(Boolean) : []}
                onChange={(val) => setFormData((prev) => ({ ...prev, boothNo: val.join(', ') }))}
                displayStyle="badges"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t space-y-5">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Photo & Verification Documents</h3>

            {/* Prominent Profile Avatar Uploader */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-zinc-50 to-primary/10 dark:from-primary/10 dark:via-zinc-900 dark:to-primary/5 border border-primary/15 shadow-sm flex flex-col sm:flex-row items-center gap-5">
              <label htmlFor="photo" className="relative group cursor-pointer shrink-0">
                <UserAvatar
                  src={formData.photoUrl}
                  name={formData.name || 'Admin'}
                  size="2xl"
                  ring="primary"
                  elevation="glow"
                />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[1px] cursor-pointer">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Change</span>
                </div>
                {formData.photoUrl && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPendingFiles(prev => ({...prev, photo: undefined}));
                      setFormData(prev => ({...prev, photoUrl: ''}));
                      const el = document.getElementById('photo') as HTMLInputElement;
                      if (el) el.value = '';
                    }}
                    className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-colors z-20"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <input 
                  id="photo" 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPendingFiles({...pendingFiles, photo: file});
                      setFormData({...formData, photoUrl: URL.createObjectURL(file)});
                    }
                  }}
                />
              </label>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <Label htmlFor="photo" className="text-base font-bold text-gray-900 dark:text-zinc-100 cursor-pointer hover:text-primary transition-colors flex items-center justify-center sm:justify-start gap-2">
                  <Camera className="w-4 h-4 text-primary" /> Administrator Profile Photo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Upload a large, clear portrait photo. Recommended format: JPG, PNG or WebP.
                </p>
                <label 
                  htmlFor="photo" 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors mt-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {formData.photoUrl ? 'Replace Photo' : 'Select Photo'}
                </label>
              </div>
            </div>

            {/* Verification Documents */}
            <div className="grid grid-cols-2 gap-4">

              {/* Aadhaar Photo */}
              <div className="space-y-2">
                <Label className="text-center block w-full text-xs font-semibold">Aadhaar</Label>
                <label htmlFor="aadhaarPhoto" className="relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group overflow-hidden bg-gray-50">
                  {formData.attachments?.aadhaarPhoto ? (
                    <>
                      {formData.attachments.aadhaarPhoto.includes('blob:') || formData.attachments.aadhaarPhoto.match(/\.(jpeg|jpg|gif|png)$/) ? (
                        <img src={formData.attachments.aadhaarPhoto} alt="Aadhaar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-muted">
                          <FileText className="w-8 h-8 text-muted-foreground mb-1" />
                          <span className="text-[10px] font-bold text-muted-foreground">PDF</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white drop-shadow-md" />
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
                        }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary">
                      <Upload className="w-6 h-6 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] font-medium text-center">Upload Aadhaar</span>
                    </div>
                  )}
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
                    }}
                  />
                </label>
              </div>

              {/* Voter ID Photo */}
              <div className="space-y-2">
                <Label className="text-center block w-full text-xs font-semibold">Voter ID</Label>
                <label htmlFor="voterIdPhoto" className="relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group overflow-hidden bg-gray-50">
                  {formData.attachments?.voterIdPhoto ? (
                    <>
                      {formData.attachments.voterIdPhoto.includes('blob:') || formData.attachments.voterIdPhoto.match(/\.(jpeg|jpg|gif|png)$/) ? (
                        <img src={formData.attachments.voterIdPhoto} alt="Voter ID" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-muted">
                          <FileText className="w-8 h-8 text-muted-foreground mb-1" />
                          <span className="text-[10px] font-bold text-muted-foreground">PDF</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white drop-shadow-md" />
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
                        }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary">
                      <Upload className="w-6 h-6 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] font-medium text-center">Upload Voter ID</span>
                    </div>
                  )}
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
                    }}
                  />
                </label>
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
