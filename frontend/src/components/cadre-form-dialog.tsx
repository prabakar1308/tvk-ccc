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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCadreDto } from '@/services/api/cadres';
import { uploadApi } from '@/services/api/upload';
import { useCreateCadre, useUpdateCadre } from '@/hooks/use-cadres';

export interface CadreFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingId?: string | null;
  cadres?: any[]; // list of existing cadres (needed to find the one being edited)
  defaultLevel?: 'KILAI' | 'UNION' | 'DISTRICT' | 'GROUP';
  defaultUnionId?: string;
  onSuccess?: () => void;
}

export function CadreFormDialog({
  isOpen,
  onOpenChange,
  editingId,
  cadres = [],
  defaultLevel = 'KILAI',
  defaultUnionId,
  onSuccess,
}: CadreFormDialogProps) {
  const createMutation = useCreateCadre();
  const updateMutation = useUpdateCadre();

  const initialFormData: CreateCadreDto = {
    name: '',
    memberId: '',
    phone: '',
    role: '',
    level: defaultLevel,
    unionId: defaultUnionId,
    aadhaarNumber: '',
    photoUrl: '',
    attachments: { aadhaarPhoto: '', voterIdPhoto: '' },
    area: '',
    boothNo: '',
  };

  const [formData, setFormData] = useState<CreateCadreDto>(initialFormData);

  const [pendingFiles, setPendingFiles] = useState<{
    photo?: File;
    aadhaarPhoto?: File;
    voterIdPhoto?: File;
  }>({});
  const [isUploading, setIsUploading] = useState(false);

  const [areaOpen, setAreaOpen] = useState(false);
  const [boothOpen, setBoothOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        const cadre = cadres.find((c) => c.id === editingId);
        if (cadre) {
          setFormData({
            name: cadre.name || '',
            memberId: cadre.memberId || '',
            phone: cadre.phone || '',
            role: cadre.role || '',
            level: cadre.level || defaultLevel,
            unionId: cadre.unionId || defaultUnionId,
            aadhaarNumber: cadre.aadhaarNumber || '',
            voterId: cadre.voterId || '',
            photoUrl: cadre.photoUrl || '',
            attachments: cadre.attachments || { aadhaarPhoto: '', voterIdPhoto: '' },
            area: cadre.area || '',
            boothNo: cadre.boothNo || '',
          });
        }
      } else {
        setFormData({ ...initialFormData, level: defaultLevel, unionId: defaultUnionId });
      }
      setPendingFiles({});
    }
  }, [isOpen, editingId, cadres, defaultLevel, defaultUnionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let photoUrl = formData.photoUrl;
      let aadhaarPhoto = formData.attachments?.aadhaarPhoto;
      let voterIdPhoto = formData.attachments?.voterIdPhoto;

      if (pendingFiles.photo) {
        const res = await uploadApi.uploadFile(pendingFiles.photo);
        photoUrl = res.url;
      }
      if (pendingFiles.aadhaarPhoto) {
        const res = await uploadApi.uploadFile(pendingFiles.aadhaarPhoto);
        aadhaarPhoto = res.url;
      }
      if (pendingFiles.voterIdPhoto) {
        const res = await uploadApi.uploadFile(pendingFiles.voterIdPhoto);
        voterIdPhoto = res.url;
      }

      const finalData: CreateCadreDto = {
        ...formData,
        photoUrl,
        attachments: {
          aadhaarPhoto,
          voterIdPhoto,
        }
      };

      if (editingId) {
        const originalCadre = cadres?.find(c => c.id === editingId);
        updateMutation.mutate({ id: editingId, data: finalData }, {
          onSuccess: () => {
            if (pendingFiles.photo && originalCadre?.photoUrl) {
              uploadApi.deleteFile(originalCadre.photoUrl).catch(console.error);
            }
            if (pendingFiles.aadhaarPhoto && originalCadre?.attachments?.aadhaarPhoto) {
              uploadApi.deleteFile(originalCadre.attachments.aadhaarPhoto).catch(console.error);
            }
            if (pendingFiles.voterIdPhoto && originalCadre?.attachments?.voterIdPhoto) {
              uploadApi.deleteFile(originalCadre.attachments.voterIdPhoto).catch(console.error);
            }

            onOpenChange(false);
            onSuccess?.();
          },
          onError: () => {
            if (pendingFiles.photo && photoUrl && photoUrl !== formData.photoUrl) {
              uploadApi.deleteFile(photoUrl).catch(console.error);
            }
            if (pendingFiles.aadhaarPhoto && aadhaarPhoto && aadhaarPhoto !== formData.attachments?.aadhaarPhoto) {
              uploadApi.deleteFile(aadhaarPhoto).catch(console.error);
            }
            if (pendingFiles.voterIdPhoto && voterIdPhoto && voterIdPhoto !== formData.attachments?.voterIdPhoto) {
              uploadApi.deleteFile(voterIdPhoto).catch(console.error);
            }
            alert("Failed to update cadre. Uploaded files were cleaned up.");
          }
        });
      } else {
        createMutation.mutate(finalData, {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
          onError: () => {
            if (pendingFiles.photo && photoUrl) uploadApi.deleteFile(photoUrl).catch(console.error);
            if (pendingFiles.aadhaarPhoto && aadhaarPhoto) uploadApi.deleteFile(aadhaarPhoto).catch(console.error);
            if (pendingFiles.voterIdPhoto && voterIdPhoto) uploadApi.deleteFile(voterIdPhoto).catch(console.error);
            alert("Failed to create cadre. Uploaded files were cleaned up.");
          }
        });
      }
    } catch (error) {
      console.error("Error uploading files", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Cadre' : 'Register New Cadre'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
                onValueChange={(val: any) => setFormData({...formData, level: val})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISTRICT">District</SelectItem>
                  <SelectItem value="GROUP">Group</SelectItem>
                  <SelectItem value="UNION">Union</SelectItem>
                  <SelectItem value="KILAI">Kilai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Designation *</Label>
              <Select 
                value={formData.role || ''} 
                onValueChange={(val) => setFormData({...formData, role: val || ''})}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Secretary">Secretary</SelectItem>
                  <SelectItem value="Joint Secretary">Joint Secretary</SelectItem>
                  <SelectItem value="Treasurer">Treasurer</SelectItem>
                  <SelectItem value="Deputy Secretary">Deputy Secretary</SelectItem>
                  <SelectItem value="Executive Committee Member">Executive Committee Member</SelectItem>
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
            <div className="col-span-2 space-y-2">
              <Label htmlFor="area">Place / Area</Label>
              <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                <PopoverTrigger 
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={areaOpen}
                    className={cn("w-full flex justify-between font-normal text-base h-10", !formData.area && "text-muted-foreground")}
                  />
                }
              >
                {formData.area ? formData.area : "Select place / area"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--anchor-width)' }}>
                  <Command>
                    <CommandInput placeholder="Search area..." />
                    <CommandList>
                      <CommandEmpty>No area found.</CommandEmpty>
                      <CommandGroup>
                        {['Area 1', 'Area 2', 'Area 3'].map((area) => (
                          <CommandItem
                            key={area}
                            value={area}
                            onSelect={(currentValue) => {
                              setFormData({ ...formData, area: currentValue === formData.area ? "" : currentValue })
                              setAreaOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.area === area ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {area}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="boothNo">Booth No.</Label>
              <Popover open={boothOpen} onOpenChange={setBoothOpen}>
                <PopoverTrigger 
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={boothOpen}
                    className={cn("w-full flex justify-between font-normal text-base h-10", !formData.boothNo && "text-muted-foreground")}
                  />
                }
              >
                {formData.boothNo ? formData.boothNo : "Select booth number"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--anchor-width)' }}>
                  <Command>
                    <CommandInput placeholder="Search booth..." />
                    <CommandList>
                      <CommandEmpty>No booth found.</CommandEmpty>
                      <CommandGroup>
                        {['Booth 1', 'Booth 2', 'Booth 3'].map((booth) => (
                          <CommandItem
                            key={booth}
                            value={booth}
                            onSelect={(currentValue) => {
                              setFormData({ ...formData, boothNo: currentValue === formData.boothNo ? "" : currentValue })
                              setBoothOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.boothNo === booth ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {booth}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Photo Uploads</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Cadre Photo */}
              <div className="space-y-2">
                <Label className="text-center block w-full text-xs font-semibold">Cadre Photo</Label>
                <label htmlFor="photo" className="relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group overflow-hidden bg-gray-50">
                  {formData.photoUrl ? (
                    <>
                      <img src={formData.photoUrl} alt="Cadre Photo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary">
                      <Upload className="w-6 h-6 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] font-medium text-center">Upload Photo</span>
                    </div>
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
              </div>

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
              {isUploading ? 'Uploading...' : editingId ? 'Save Changes' : 'Register Cadre'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
