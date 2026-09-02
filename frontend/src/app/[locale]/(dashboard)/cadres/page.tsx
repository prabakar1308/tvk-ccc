'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, UserCheck, UserPlus, Trophy, Eye, Edit2, Trash2, Upload, FileText } from "lucide-react";
import { useCadres, useCreateCadre, useUpdateCadre, useDeleteCadre } from '@/hooks/use-cadres';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateCadreDto } from '@/services/api/cadres';
import { uploadApi } from '@/services/api/upload';

export default function CadresPage() {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: cadres, isLoading } = useCadres();
  const createMutation = useCreateCadre();
  const updateMutation = useUpdateCadre();
  const deleteMutation = useDeleteCadre();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormData: CreateCadreDto = {
    name: '',
    memberId: '',
    phone: '',
    role: '',
    level: 'KILAI',
    aadhaarNumber: '',
    voterId: '',
    photoUrl: '',
    attachments: { aadhaarPhoto: '', voterIdPhoto: '' },
  };

  const [formData, setFormData] = useState<CreateCadreDto>(initialFormData);

  const [pendingFiles, setPendingFiles] = useState<{
    photo?: File;
    aadhaarPhoto?: File;
    voterIdPhoto?: File;
  }>({});
  const [isUploading, setIsUploading] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setPendingFiles({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cadre: any) => {
    setEditingId(cadre.id);
    setFormData({
      name: cadre.name || '',
      memberId: cadre.memberId || '',
      phone: cadre.phone || '',
      role: cadre.role || '',
      level: cadre.level || 'KILAI',
      aadhaarNumber: cadre.aadhaarNumber || '',
      voterId: cadre.voterId || '',
      photoUrl: cadre.photoUrl || '',
      attachments: cadre.attachments || { aadhaarPhoto: '', voterIdPhoto: '' },
    });
    setPendingFiles({});
    setIsModalOpen(true);
  };

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
            // Delete old files that were replaced by new ones
            if (pendingFiles.photo && originalCadre?.photoUrl) {
              uploadApi.deleteFile(originalCadre.photoUrl).catch(console.error);
            }
            if (pendingFiles.aadhaarPhoto && originalCadre?.attachments?.aadhaarPhoto) {
              uploadApi.deleteFile(originalCadre.attachments.aadhaarPhoto).catch(console.error);
            }
            if (pendingFiles.voterIdPhoto && originalCadre?.attachments?.voterIdPhoto) {
              uploadApi.deleteFile(originalCadre.attachments.voterIdPhoto).catch(console.error);
            }

            setIsModalOpen(false);
            setPendingFiles({});
          },
          onError: () => {
            // Cleanup newly uploaded files if the cadre update fails
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
            setIsModalOpen(false);
            setPendingFiles({});
          },
          onError: () => {
            // Cleanup newly uploaded files if the cadre creation fails
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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this cadre?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCadres = cadres?.filter((cadre) => {
    const matchesSearch = cadre.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cadre.memberId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cadre.phone?.includes(searchQuery);
    const matchesLevel = levelFilter === 'ALL' || cadre.level === levelFilter;
    return matchesSearch && matchesLevel;
  }) || [];

  const getRoleBadge = (role: string | undefined, level: string) => {
    const displayRole = role || 'Cadre';
    if (level === 'DISTRICT') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#8F0A1B] text-white border border-[#8F0A1B]/20 shadow-sm">{displayRole}</span>;
    }
    if (level === 'UNION') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-manjal text-black border border-manjal/20 shadow-sm">{displayRole}</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">{displayRole}</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase tracking-wide text-primary">Cadres</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Manage party members, roles, and grassroots engagement.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger 
            render={
              <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95" />
            }
          >
            <Plus className="mr-2 h-5 w-5" /> Register Cadre
          </DialogTrigger>
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
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || isUploading}>
                  {isUploading ? 'Uploading...' : editingId ? 'Save Changes' : 'Register Cadre'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Cadres</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">{cadres?.length || 0}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-manjal/20 rounded-md text-amber-600 dark:text-manjal">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">New This Month</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">+{(cadres?.length || 0) > 0 ? 1 : 0}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-sm bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-md text-primary">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Cadres</p>
              <h2 className="text-4xl font-heading font-bold text-foreground mt-1">100%</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-primary/10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search cadres by name, ID, or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-primary/20 focus-visible:ring-primary/30 rounded-md transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="h-11 rounded-md px-6 font-medium border-primary/20 text-primary hover:bg-primary/5">Export CSV</Button>
        </div>
      </div>

      {/* Data Table with Tabs */}
      <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden p-2">
        <div className="flex border-b border-primary/10 mb-4 px-2 space-x-4 overflow-x-auto">
          {['ALL', 'DISTRICT', 'GROUP', 'UNION', 'KILAI'].map((level) => (
            <button 
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-4 py-2 font-semibold whitespace-nowrap ${levelFilter === level ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              {level === 'ALL' ? 'All Cadres' : `${level.charAt(0) + level.slice(1).toLowerCase()} Level`}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading cadres...</div>
          ) : filteredCadres.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No cadres found.</div>
          ) : (
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-primary py-4">Member ID</TableHead>
                  <TableHead className="font-semibold text-primary py-4">Name</TableHead>
                  <TableHead className="font-semibold text-primary py-4">Level</TableHead>
                  <TableHead className="font-semibold text-primary py-4">Designation</TableHead>
                  <TableHead className="font-semibold text-primary py-4">Phone</TableHead>
                  <TableHead className="font-semibold text-primary py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCadres.map((cadre) => (
                  <TableRow key={cadre.id} className="hover:bg-primary/5 transition-colors group border-b-primary/10">
                    <TableCell className="font-bold text-muted-foreground py-4">{cadre.memberId}</TableCell>
                    <TableCell className="font-bold text-base py-4 text-foreground flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                        <img src={cadre.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cadre.name)}&background=random`} alt={cadre.name} className="w-full h-full object-cover" />
                      </div>
                      {cadre.name}
                    </TableCell>
                    <TableCell className="py-4 font-medium text-primary">{cadre.level}</TableCell>
                    <TableCell className="py-4">
                      {getRoleBadge(cadre.role, cadre.level)}
                    </TableCell>
                    <TableCell className="font-medium py-4 text-muted-foreground">{cadre.phone || '-'}</TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button onClick={() => handleOpenEdit(cadre)} variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDelete(cadre.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
