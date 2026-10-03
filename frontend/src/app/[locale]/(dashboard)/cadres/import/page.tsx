'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, AlertCircle, ArrowLeft, Edit2, Trash2, Download } from "lucide-react";
import { useCreateBulkCadres } from '@/hooks/use-cadres';
import { useUnions } from '@/hooks/use-unions';
import { useKilais } from '@/hooks/use-kilais';
import { useBooths, useBoothAreas } from '@/hooks/use-booths';
import { AreaMultiSelect } from "@/components/shared/area-multi-select";
import { BoothMultiSelect } from "@/components/shared/booth-multi-select";
import { cleanRomanize } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { CreateCadreDto } from '@/services/api/cadres';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ImportCadresPage() {
  const router = useRouter();
  const [importLevel, setImportLevel] = useState<string>('KILAI');
  const [importUnionId, setImportUnionId] = useState<string>('');
  const [importKilaiId, setImportKilaiId] = useState<string>('');
  const [parsedCadres, setParsedCadres] = useState<CreateCadreDto[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [duplicateErrors, setDuplicateErrors] = useState<any[]>([]);

  // Bulk Overrides
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedBooths, setSelectedBooths] = useState<string[]>([]);
  
  // Dialog Edit State
  const [editingRow, setEditingRow] = useState<(CreateCadreDto & { index: number }) | null>(null);

  const { data: unions = [] } = useUnions();
  const { data: kilais = [] } = useKilais();
  const { data: booths = [] } = useBooths();
  const { data: allAreas = [] } = useBoothAreas();
  const bulkCreateMutation = useCreateBulkCadres();

  const filteredKilais = importUnionId ? kilais.filter((k: any) => String(k.unionId) === importUnionId) : kilais;

  const processCadreData = (data: any[][], isPaste = false) => {
    try {
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
        if (lower.includes('உறுப்பினர்')) return 'Executive Committee Member';
        return role;
      };



      const mapArea = (rawArea: string) => {
        if (!rawArea) return '';
        const enArea = cleanRomanize(rawArea);
        const cleanEn = enArea.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (!cleanEn) return enArea;

        const found = allAreas.find((a: string) => {
           const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
           return cleanA === cleanEn;
        });
        if (found) return found;
        
        const fuzzyFound = allAreas.find((a: string) => {
           const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
           return cleanA.includes(cleanEn) || cleanEn.includes(cleanA);
        });
        
        return fuzzyFound || enArea;
      };

      const mappedCadres: CreateCadreDto[] = rows.map((row) => {
        let colIndex = 3;

        let finalArea = '';
        if (selectedAreas.length > 0) {
          finalArea = selectedAreas.join(', ');
        } else {
          finalArea = mapArea(row[colIndex]?.toString() || '');
          colIndex++;
        }

        let matchedBoothNo = '';
        if (selectedBooths.length > 0) {
          matchedBoothNo = selectedBooths.join(', ');
        } else {
          const rawBoothNo = row[colIndex]?.toString() || '';
          colIndex++;
          matchedBoothNo = rawBoothNo;
          if (rawBoothNo) {
            const cleanRaw = rawBoothNo.replace(/\s+/g, '').toLowerCase();
            const found = booths.find((b: any) => b.boothNo.replace(/\s+/g, '').toLowerCase() === cleanRaw);
            if (found) {
              matchedBoothNo = found.boothNo;
            }
          }
        }

        const phone = row[colIndex]?.toString() || '';
        colIndex++;
        const aadhaarNumber = row[colIndex]?.toString() || '';
        colIndex++;
        const memberId = row[colIndex]?.toString() || '';
        const voterId = row[colIndex]?.toString() || '';

        return {
          name: cleanRomanize(row[1]?.toString() || ''),
          role: translateRole(row[2]?.toString() || ''),
          area: finalArea,
          boothNo: matchedBoothNo,
          phone: phone,
          aadhaarNumber: aadhaarNumber,
          memberId: memberId,
          voterId: voterId,
          level: importLevel as any,
          unionId: importUnionId || undefined,
          homeKilaiId: importKilaiId || undefined,
        };
      });

      if (isPaste) {
        setParsedCadres((prev) => [...prev, ...mappedCadres]);
      } else {
        setParsedCadres(mappedCadres);
      }
      setImportError(null);
    } catch (error) {
      console.error(error);
      setImportError("Failed to parse data. Ensure it matches the template format.");
    }
  };

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
        
        processCadreData(data, false);
      } catch (error) {
        console.error(error);
        setImportError("Failed to parse Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // reset input
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;

    const rows = clipboardData.split('\n').filter(row => row.trim() !== '');
    const dataArray = rows.map(row => row.split('\t'));
    
    processCadreData(dataArray, true);
  };

  const handleBulkSubmit = async () => {
    if (importLevel === 'KILAI' && !importKilaiId) {
      setImportError("Please select a Kilai");
      return;
    }
    if (importLevel === 'UNION' && !importUnionId) {
      setImportError("Please select a Union");
      return;
    }

    setImportError(null);
    setDuplicateErrors([]);
    try {
      const finalPayload = parsedCadres.map(c => ({
        ...c,
        level: importLevel as any,
        unionId: importUnionId || undefined,
        homeKilaiId: importKilaiId || undefined,
      }));
      
      await bulkCreateMutation.mutateAsync(finalPayload);
      router.push('/cadres');
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.duplicates) {
        setDuplicateErrors(data.duplicates);
        setImportError("Duplicate records found for the below names:");
      } else {
        setImportError(data?.message || error.message || "Failed to Import Administrators");
      }
    }
  };

  const handleSaveEdit = () => {
    if (!editingRow) return;
    const { index, ...rest } = editingRow;
    const newCadres = [...parsedCadres];
    newCadres[index] = { ...rest } as CreateCadreDto;
    setParsedCadres(newCadres);
    setEditingRow(null);
  };

  const applyOverrides = (areas: string[], boothNos: string[]) => {
    if (parsedCadres.length === 0) return;
    setParsedCadres(prev => prev.map(c => ({
      ...c,
      area: areas.length > 0 ? areas.join(', ') : c.area,
      boothNo: boothNos.length > 0 ? boothNos.join(', ') : c.boothNo,
    })));
  };

  const handleAreaSelect = (area: string) => {
    setSelectedAreas(prev => {
      const newAreas = prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area];
      applyOverrides(newAreas, selectedBooths);
      return newAreas;
    });
  };

  const handleBoothSelect = (boothNo: string) => {
    setSelectedBooths(prev => {
      const newBooths = prev.includes(boothNo) ? prev.filter(b => b !== boothNo) : [...prev, boothNo];
      applyOverrides(selectedAreas, newBooths);
      return newBooths;
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/cadres" className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-gray-900">Import Administrators</h1>
            <p className="text-muted-foreground font-medium mt-1">
              Upload an Excel/CSV file to bulk Import Administrators
            </p>
          </div>
        </div>
        <a href="/Kilai Details Template.xlsx" download>
          <Button variant="outline" className="gap-2 bg-white">
            <Download className="w-4 h-4" />
            Download Template
          </Button>
        </a>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100 space-y-6">
        {/* Form Fields Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Import Level</Label>
            <Select value={importLevel} onValueChange={(value) => setImportLevel(value || '')}>
              <SelectTrigger className="w-full text-base">
                <SelectValue placeholder="Select level">
                  {importLevel === 'DISTRICT' ? 'District' : importLevel === 'UNION' ? 'Organizational Unit' : importLevel === 'KILAI' ? 'Kilai' : ''}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DISTRICT">District</SelectItem>
                <SelectItem value="UNION">Organizational Unit</SelectItem>
                <SelectItem value="KILAI">Kilai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(importLevel === 'UNION' || importLevel === 'KILAI') && (
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <Label>Select Organizational Unit</Label>
              <Select value={importUnionId} onValueChange={(value) => {
                setImportUnionId(value || '');
                if (importLevel === 'KILAI') setImportKilaiId(''); // Reset Kilai when Org Unit changes
              }}>
                <SelectTrigger className="w-full text-base">
                  <SelectValue placeholder="Select Organizational Unit">
                    {importUnionId ? unions.find((u: any) => String(u.id) === importUnionId)?.name : undefined}
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
            <>
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <Label>Select Kilai</Label>
                <Select value={importKilaiId} onValueChange={(value) => setImportKilaiId(value || '')} disabled={!importUnionId}>
                  <SelectTrigger className="w-full text-base">
                    <SelectValue placeholder="Select Kilai">
                      {importKilaiId ? kilais.find((k: any) => String(k.id) === importKilaiId)?.name : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredKilais.map((k: any) => (
                      <SelectItem key={String(k.id)} value={String(k.id)}>{k.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                <Label>Area (Optional)</Label>
                <AreaMultiSelect
                  value={selectedAreas}
                  onChange={setSelectedAreas}
                  displayStyle="badges"
                />
              </div>

              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                <Label>Booth (Optional)</Label>
                <BoothMultiSelect
                  value={selectedBooths}
                  onChange={setSelectedBooths}
                  displayStyle="badges"
                />
              </div>
            </>
          )}
        </div>

        {/* Upload and Paste Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
          <div className="space-y-2">
            <Label>Upload Excel File</Label>
            <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-primary/30 rounded-lg cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
              <div className="flex flex-col items-center justify-center py-4">
                <UploadCloud className="w-8 h-8 text-primary/60 mb-2" />
                <p className="text-sm text-foreground font-semibold"><span className="text-primary">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-muted-foreground">.xlsx or .xls files only</p>
              </div>
              <input id="cadre-file-upload" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          
          <div className="space-y-2">
            <Label>Paste Data from Excel</Label>
            <textarea 
              onPaste={handlePaste}
              placeholder="Click here and press Ctrl+V to paste cells directly from Excel..."
              className="w-full min-h-[120px] p-4 text-sm bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none placeholder:text-center placeholder:pt-8"
            />
          </div>
        </div>

        {importError && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span>{importError}</span>
              {duplicateErrors.length > 0 && (
                <ul className="list-disc pl-5 mt-1 opacity-90 font-normal">
                  {duplicateErrors.map((err, i) => (
                    <li key={i}>{err.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Parsed Cadres Table */}
      {parsedCadres.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex justify-between items-end">
            <h3 className="font-bold text-lg text-gray-900">Preview ({parsedCadres.length} administrators)</h3>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setParsedCadres([]);
                  setImportError(null);
                  setDuplicateErrors([]);
                  const fileInput = document.getElementById('cadre-file-upload') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                disabled={bulkCreateMutation.isPending}
              >
                Clear Data
              </Button>
              <Button onClick={handleBulkSubmit} disabled={bulkCreateMutation.isPending} className="bg-primary hover:bg-primary/90 text-white">
                {bulkCreateMutation.isPending ? 'Importing...' : 'Submit Administrators'}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[800px]">
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead className="font-semibold text-primary py-4">Name</TableHead>
                    <TableHead className="font-semibold text-primary py-4">Role</TableHead>
                    <TableHead className="font-semibold text-primary py-4">Area</TableHead>
                    <TableHead className="font-semibold text-primary py-4">Booth No</TableHead>
                    <TableHead className="font-semibold text-primary py-4">Phone</TableHead>
                    <TableHead className="font-semibold text-primary py-4">Aadhaar</TableHead>
                    <TableHead className="font-semibold text-primary py-4">Voter ID</TableHead>
                    <TableHead className="text-right sticky right-0 bg-primary/5 z-10 font-semibold text-primary py-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedCadres.map((cadre, idx) => (
                    <TableRow key={idx} className="hover:bg-primary/5 transition-colors group">
                      <TableCell className="p-3 font-medium whitespace-nowrap">{cadre.name || <span className="text-red-500 text-xs">Required</span>}</TableCell>
                      <TableCell className="p-3">{cadre.role}</TableCell>
                      <TableCell className="p-3">{cadre.area}</TableCell>
                      <TableCell className="p-3">{cadre.boothNo}</TableCell>
                      <TableCell className="p-3">{cadre.phone}</TableCell>
                      <TableCell className="p-3">{cadre.aadhaarNumber}</TableCell>
                      <TableCell className="p-3">{cadre.voterId}</TableCell>
                      <TableCell className="p-2 text-right sticky right-0 bg-card group-hover:bg-primary/5 transition-colors z-10 shadow-[-1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setEditingRow({ ...cadre, index: idx })}>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Administrator Dialog */}
      <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Administrator</DialogTitle>
          </DialogHeader>
          {editingRow && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name <span className="text-red-500">*</span></Label>
                <Input value={editingRow.name} onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={editingRow.role || ''} onValueChange={(val) => setEditingRow({ ...editingRow, role: val || '' })}>
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
                  <Label>Phone</Label>
                  <Input value={editingRow.phone} onChange={(e) => setEditingRow({ ...editingRow, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2 flex flex-col">
                <Label>Area / Village</Label>
                <AreaMultiSelect
                  value={editingRow.area ? editingRow.area.split(',').map(s=>s.trim()).filter(Boolean) : []}
                  onChange={(val) => setEditingRow({...editingRow, area: val.join(', ')})}
                  displayStyle="badges"
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <Label>Booth No</Label>
                <BoothMultiSelect
                  value={editingRow.boothNo ? editingRow.boothNo.split(',').map(s=>s.trim()).filter(Boolean) : []}
                  onChange={(val) => setEditingRow({...editingRow, boothNo: val.join(', ')})}
                  displayStyle="badges"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aadhaar</Label>
                  <Input value={editingRow.aadhaarNumber} onChange={(e) => setEditingRow({ ...editingRow, aadhaarNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Voter ID</Label>
                  <Input value={editingRow.voterId} onChange={(e) => setEditingRow({ ...editingRow, voterId: e.target.value, memberId: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRow(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
