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
import { Search, Plus, UserCheck, UserPlus, Trophy, Eye, Edit2, Trash2, Upload, FileText, Check, ChevronsUpDown, UploadCloud, AlertCircle } from "lucide-react";
import { useCadres, useCreateCadre, useUpdateCadre, useDeleteCadre, useCreateBulkCadres } from '@/hooks/use-cadres';
import { useUnions } from '@/hooks/use-unions';
import { useKilais } from '@/hooks/use-kilais';
import * as XLSX from 'xlsx';
import { romanize } from 'tamil-romanizer';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CadreFormDialog } from '@/components/cadre-form-dialog';

export default function CadresPage() {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: cadres, isLoading } = useCadres();
  const createMutation = useCreateCadre();
  const updateMutation = useUpdateCadre();
  const deleteMutation = useDeleteCadre();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLevel, setImportLevel] = useState<string>('KILAI');
  const [importUnionId, setImportUnionId] = useState<string>('');
  const [importKilaiId, setImportKilaiId] = useState<string>('');
  const [parsedCadres, setParsedCadres] = useState<CreateCadreDto[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [tempEditRow, setTempEditRow] = useState<CreateCadreDto | null>(null);

  const { data: unions = [] } = useUnions();
  const { data: kilais = [] } = useKilais();
  const bulkCreateMutation = useCreateBulkCadres();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        // Filter out empty rows and header rows
        const rows = data.filter(row => {
          if (!row || row.length === 0 || !row[1]) return false;
          const nameCol = String(row[1]).trim();
          if (nameCol === 'பெயர்' || nameCol === 'Name') return false;
          return true;
        });
        
        const translateRole = (role: string) => {
          if (!role) return '';
          const lower = role.trim().toLowerCase();
          if (lower.includes('செயலாளர்') && lower.includes('இணை')) return 'Joint Secretary';
          if (lower.includes('செயலாளர்') && lower.includes('துணை')) return 'Deputy Secretary';
          if (lower.includes('செயலாளர்')) return 'Secretary';
          if (lower.includes('பொருளாளர்')) return 'Treasurer';
          if (lower.includes('செயற்குழு')) return 'Executive Committee Member';
          if (lower.includes('உறுப்பினர்')) return 'Executive Committee Member'; // fallback
          
          // If English or unknown, return as-is (maybe capitalized)
          return role;
        };

        const safeRomanize = (text: string) => {
          if (!text) return '';
          try {
            // Check if it contains Tamil characters (Unicode block 0B80–0BFF)
            const tamilRegex = /[\u0B80-\u0BFF]/;
            if (tamilRegex.test(text)) {
              return romanize(text);
            }
            return text;
          } catch (e) {
            return text;
          }
        };

        const mappedCadres: CreateCadreDto[] = rows.map((row) => ({
          name: safeRomanize(row[1]?.toString() || ''),
          role: translateRole(row[2]?.toString() || ''),
          area: safeRomanize(row[3]?.toString() || ''),
          boothNo: row[4]?.toString() || '',
          phone: row[5]?.toString() || '',
          aadhaarNumber: row[6]?.toString() || '',
          memberId: row[7]?.toString() || '',
          voterId: row[7]?.toString() || '',
          level: importLevel as any,
          unionId: importUnionId || undefined,
          homeKilaiId: importKilaiId || undefined,
        }));
        setParsedCadres(mappedCadres);
        setImportError(null);
      } catch (error) {
        console.error(error);
        setImportError("Failed to parse Excel file. Ensure it matches the template format.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // reset input
  };

  const handleBulkSubmit = async () => {
    setImportError(null);
    try {
      const finalPayload = parsedCadres.map(c => ({
        ...c,
        level: importLevel as any,
        unionId: importUnionId || undefined,
        homeKilaiId: importKilaiId || undefined,
      }));
      
      await bulkCreateMutation.mutateAsync(finalPayload);
      setIsImportModalOpen(false);
      setParsedCadres([]);
      setImportUnionId('');
      setImportKilaiId('');
    } catch (error: any) {
      setImportError(error.response?.data?.message || error.message || "Failed to import cadres");
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cadre: any) => {
    setEditingId(cadre.id);
    setIsModalOpen(true);
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
        
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
            <Plus className="mr-2 h-5 w-5" /> Register Cadre
          </Button>
      <CadreFormDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingId={editingId}
        cadres={cadres}
      />

      </div>
      {/* Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={(open) => {
        setIsImportModalOpen(open);
        if (!open) {
          setParsedCadres([]);
          setImportError(null);
          setEditingRowIdx(null);
          setTempEditRow(null);
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Import Cadres from Excel</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col px-6 min-h-0">
            
            <div className="shrink-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Import Level</Label>
                <Select value={importLevel} onValueChange={setImportLevel}>
                  <SelectTrigger className="w-full text-base">
                    <SelectValue placeholder="Select level">
                      {importLevel === 'DISTRICT' ? 'District' : importLevel === 'UNION' ? 'Union' : importLevel === 'KILAI' ? 'Kilai' : ''}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISTRICT">District</SelectItem>
                    <SelectItem value="UNION">Union</SelectItem>
                    <SelectItem value="KILAI">Kilai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {importLevel === 'UNION' && (
                <div className="space-y-2">
                  <Label>Select Union</Label>
                  <Select value={importUnionId} onValueChange={setImportUnionId}>
                    <SelectTrigger className="w-full text-base">
                      <SelectValue placeholder="Select Union">
                        {importUnionId ? unions.find((u: any) => String(u.id) === importUnionId)?.name : ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {unions.map((u: any) => (
                        <SelectItem key={String(u.id)} value={String(u.id)}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {importLevel === 'KILAI' && (
                <div className="space-y-2">
                  <Label>Select Kilai</Label>
                  <Select value={importKilaiId} onValueChange={setImportKilaiId}>
                    <SelectTrigger className="w-full text-base">
                      <SelectValue placeholder="Select Kilai">
                        {importKilaiId ? kilais.find((k: any) => String(k.id) === importKilaiId)?.name : ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {kilais.map((k: any) => (
                        <SelectItem key={String(k.id)} value={String(k.id)}>{k.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Upload Excel File</Label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-2 text-primary/60" />
                  <p className="mb-2 text-sm text-foreground font-semibold"><span className="text-primary">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-muted-foreground">.xlsx or .xls files only</p>
                </div>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {importError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-2 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            </div>

            {parsedCadres.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0 mt-6 space-y-2">
                <h3 className="font-semibold text-sm shrink-0">Preview ({parsedCadres.length} rows)</h3>
                <div className="border rounded-md overflow-auto flex-1 min-h-0 w-full relative">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Booth No</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Aadhaar</TableHead>
                        <TableHead>Member ID</TableHead>
                        <TableHead className="text-right sticky right-0 bg-muted z-10 shadow-[-1px_0_0_rgba(0,0,0,0.05)] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-border">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedCadres.map((cadre, idx) => (
                        <TableRow key={idx}>
                          {editingRowIdx === idx ? (
                            <>
                              <TableCell className="p-2"><Input className="h-8 min-w-[120px]" value={tempEditRow?.name || ''} onChange={(e) => setTempEditRow({...tempEditRow!, name: e.target.value})} /></TableCell>
                              <TableCell className="p-2"><Input className="h-8 min-w-[120px]" value={tempEditRow?.role || ''} onChange={(e) => setTempEditRow({...tempEditRow!, role: e.target.value})} /></TableCell>
                              <TableCell className="p-2"><Input className="h-8 min-w-[120px]" value={tempEditRow?.area || ''} onChange={(e) => setTempEditRow({...tempEditRow!, area: e.target.value})} /></TableCell>
                              <TableCell className="p-2"><Input className="h-8 min-w-[120px]" value={tempEditRow?.boothNo || ''} onChange={(e) => setTempEditRow({...tempEditRow!, boothNo: e.target.value})} /></TableCell>
                              <TableCell className="p-2"><Input className="h-8 min-w-[120px]" value={tempEditRow?.phone || ''} onChange={(e) => setTempEditRow({...tempEditRow!, phone: e.target.value})} /></TableCell>
                              <TableCell className="p-2"><Input className="h-8 min-w-[120px]" value={tempEditRow?.aadhaarNumber || ''} onChange={(e) => setTempEditRow({...tempEditRow!, aadhaarNumber: e.target.value})} /></TableCell>
                              <TableCell className="p-2"><Input className="h-8 min-w-[120px]" value={tempEditRow?.memberId || ''} onChange={(e) => setTempEditRow({...tempEditRow!, memberId: e.target.value})} /></TableCell>
                              <TableCell className="p-2 text-right sticky right-0 bg-background z-10 shadow-[-1px_0_0_rgba(0,0,0,0.05)] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-border">
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" onClick={() => {
                                    const newCadres = [...parsedCadres];
                                    newCadres[idx] = tempEditRow!;
                                    setParsedCadres(newCadres);
                                    setEditingRowIdx(null);
                                  }}>Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingRowIdx(null)}>Cancel</Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="p-3 font-medium">{cadre.name}</TableCell>
                              <TableCell className="p-3">{cadre.role}</TableCell>
                              <TableCell className="p-3">{cadre.area}</TableCell>
                              <TableCell className="p-3">{cadre.boothNo}</TableCell>
                              <TableCell className="p-3">{cadre.phone}</TableCell>
                              <TableCell className="p-3">{cadre.aadhaarNumber}</TableCell>
                              <TableCell className="p-3">{cadre.memberId}</TableCell>
                              <TableCell className="p-2 text-right sticky right-0 bg-background z-10 shadow-[-1px_0_0_rgba(0,0,0,0.05)] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-border">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingRowIdx(idx); setTempEditRow(cadre); }}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                                    const newCadres = parsedCadres.filter((_, i) => i !== idx);
                                    setParsedCadres(newCadres);
                                  }}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4 p-6 pt-4 border-t shrink-0">
            <Button variant="outline" onClick={() => { setIsImportModalOpen(false); setParsedCadres([]); setImportError(null); }}>Cancel</Button>
            <Button onClick={handleBulkSubmit} disabled={parsedCadres.length === 0 || bulkCreateMutation.isPending}>
              {bulkCreateMutation.isPending ? 'Importing...' : 'Import Cadres'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="h-11 rounded-md px-6 font-medium border-primary/20 text-primary hover:bg-primary/5">
            <UploadCloud className="w-4 h-4 mr-2" /> Import Excel
          </Button>
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
