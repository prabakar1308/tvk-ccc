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

interface ParsedCadre extends CreateCadreDto {
  fatherName?: string;
}

export default function ImportCadresPage() {
  const router = useRouter();
  const [importLevel, setImportLevel] = useState<string>('KILAI');
  const [importUnionId, setImportUnionId] = useState<string>('');
  const [importKilaiId, setImportKilaiId] = useState<string>('');
  const [parsedCadres, setParsedCadres] = useState<ParsedCadre[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [duplicateErrors, setDuplicateErrors] = useState<any[]>([]);

  // Bulk Overrides
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedBooths, setSelectedBooths] = useState<string[]>([]);
  
  // Dialog Edit State
  const [editingRow, setEditingRow] = useState<(ParsedCadre & { index: number }) | null>(null);

  const { data: unions = [] } = useUnions();
  const { data: kilais = [] } = useKilais();
  const { data: booths = [] } = useBooths();
  const { data: allAreas = [] } = useBoothAreas();
  const bulkCreateMutation = useCreateBulkCadres();

  const filteredKilais = importUnionId ? kilais.filter((k: any) => String(k.unionId) === importUnionId) : kilais;

  const isTableHeaderRow = (row: any[]): boolean => {
    if (!row || !Array.isArray(row)) return false;
    const rowStr = row.map(cell => String(cell || '').trim().toLowerCase()).join(' ');
    const hasName = rowStr.includes('பெயர்') || rowStr.includes('name');
    const hasOtherHeaders = 
      rowStr.includes('வ.எண்') || 
      rowStr.includes('வரிசை') || 
      rowStr.includes('s.no') || 
      rowStr.includes('sl.no') || 
      rowStr.includes('sno') || 
      rowStr.includes('பதவி') || 
      rowStr.includes('role') || 
      rowStr.includes('வாக்காளர்') || 
      rowStr.includes('voter') || 
      rowStr.includes('ஆதார்') || 
      rowStr.includes('aadhaar');
    
    const isTopMetadata = rowStr.includes('மாவட்ட செயலாளர்') || rowStr.includes('ஒன்றிய செயலாளர்');
    return hasName && hasOtherHeaders && !isTopMetadata;
  };

  const translateRole = (role: string) => {
    if (!role) return '';
    const trimmed = role.trim();
    const lower = trimmed.toLowerCase();
    
    if (lower.includes('செயலாளர்') && lower.includes('இணை')) return 'Joint Secretary';
    if (lower.includes('செயலாளர்') && lower.includes('துணை')) return 'Deputy Secretary';
    if (lower.includes('செயலாளர்')) return 'Secretary';
    if (lower.includes('பொருளாளர்')) return 'Treasurer';
    if (lower.includes('செயற்குழு') || lower.includes('உறுப்பினர்')) return 'Executive Committee Member';

    if (lower === 'secretary') return 'Secretary';
    if (lower === 'joint secretary') return 'Joint Secretary';
    if (lower === 'deputy secretary') return 'Deputy Secretary';
    if (lower === 'treasurer') return 'Treasurer';
    if (lower === 'executive committee member' || lower === 'ec member') return 'Executive Committee Member';

    return trimmed;
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

  const processCadreData = (data: any[][], isPaste = false) => {
    try {
      if (!data || data.length === 0) return;

      // 1. Detect table header row
      const headerRowIndex = data.findIndex(isTableHeaderRow);

      // Default column indices based on template:
      // col 1 - S.no (0)
      // col 2 - Name (1)
      // col 3 - Father's Name (2)
      // col 4 - Role (3)
      // col 5 - Area (4)
      // col 6 - Booth No (5)
      // col 7 - Phone no (6)
      // col 8 - Aadhaar (7)
      // col 9 - Member/Voter Id (8)
      let nameIdx = 1;
      let fatherNameIdx = 2;
      let roleIdx = 3;
      let areaIdx = 4;
      let boothIdx = 5;
      let phoneIdx = 6;
      let aadhaarIdx = 7;
      let voterIdIdx = 8;

      if (headerRowIndex !== -1) {
        const header = data[headerRowIndex];
        header.forEach((cell, idx) => {
          const text = String(cell || '').trim().toLowerCase();
          if (text.includes('தந்தை') || text.includes('father')) {
            fatherNameIdx = idx;
          } else if (text.includes('பெயர்') || text.includes('name')) {
            nameIdx = idx;
          } else if (text.includes('பதவி') || text.includes('role') || text.includes('designation')) {
            roleIdx = idx;
          } else if (text.includes('பஞ்சாயத்து') || text.includes('கிராமம்') || text.includes('area') || text.includes('village') || text.includes('panchayat')) {
            areaIdx = idx;
          } else if (text.includes('வார்டு') || text.includes('வாக்குச்சாவடி') || text.includes('booth') || text.includes('ward')) {
            boothIdx = idx;
          } else if (text.includes('தொலைபேசி') || text.includes('phone') || text.includes('mobile') || text.includes('contact') || text.includes('cell')) {
            phoneIdx = idx;
          } else if (text.includes('ஆதார்') || text.includes('aadhaar') || text.includes('aadhar')) {
            aadhaarIdx = idx;
          } else if (text.includes('வாக்காளர்') || text.includes('உறுப்பினர்') || text.includes('voter') || text.includes('member')) {
            voterIdIdx = idx;
          }
        });

        // Check top metadata rows for Union or Kilai
        for (let r = 0; r < headerRowIndex; r++) {
          const row = data[r];
          if (!row) continue;
          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').trim().toLowerCase();
            if ((cell === 'ஒன்றியம்' || cell === 'union') && !importUnionId) {
              const uVal = String(row[c + 1] || '').trim();
              if (uVal) {
                const matched = unions.find((u: any) => 
                  u.name?.toLowerCase().includes(uVal.toLowerCase()) || 
                  uVal.toLowerCase().includes(u.name?.toLowerCase()) ||
                  (u.tamilName && (u.tamilName.includes(uVal) || uVal.includes(u.tamilName)))
                );
                if (matched) setImportUnionId(String(matched.id));
              }
            }
            if ((cell === 'கிளை' || cell === 'kilai' || cell === 'branch') && !importKilaiId) {
              const kVal = String(row[c + 1] || '').trim();
              if (kVal) {
                const matched = kilais.find((k: any) => 
                  k.name?.toLowerCase().includes(kVal.toLowerCase()) || 
                  kVal.toLowerCase().includes(k.name?.toLowerCase()) ||
                  (k.tamilName && (k.tamilName.includes(kVal) || kVal.includes(k.tamilName)))
                );
                if (matched) setImportKilaiId(String(matched.id));
              }
            }
          }
        }
      } else {
        // Direct paste or data without header row: check if first column is numeric (S.No) or text (Name)
        const firstRow = data.find(r => r && r.length > 0 && r.some(c => String(c || '').trim() !== ''));
        if (firstRow) {
          const col0 = String(firstRow[0] || '').trim();
          if (col0 && !/^\d+$/.test(col0) && firstRow.length <= 8) {
            // S.No was omitted
            nameIdx = 0;
            fatherNameIdx = 1;
            roleIdx = 2;
            areaIdx = 3;
            boothIdx = 4;
            phoneIdx = 5;
            aadhaarIdx = 6;
            voterIdIdx = 7;
          }
        }
      }

      // Filter rows after header
      const dataRows = (headerRowIndex !== -1 ? data.slice(headerRowIndex + 1) : data).filter(row => {
        if (!row || row.length === 0) return false;
        const nameVal = String(row[nameIdx] || '').trim();
        if (!nameVal) return false;
        if (nameVal === 'பெயர்' || nameVal.toLowerCase() === 'name') return false;
        return true;
      });

      const mappedCadres: ParsedCadre[] = dataRows.map((row) => {
        const rawName = String(row[nameIdx] || '').trim();
        const rawFatherName = fatherNameIdx !== -1 && row[fatherNameIdx] != null ? String(row[fatherNameIdx]).trim() : '';
        const rawRole = roleIdx !== -1 && row[roleIdx] != null ? String(row[roleIdx]).trim() : '';
        const rawArea = areaIdx !== -1 && row[areaIdx] != null ? String(row[areaIdx]).trim() : '';
        const rawBoothNo = boothIdx !== -1 && row[boothIdx] != null ? String(row[boothIdx]).trim() : '';
        const rawPhone = phoneIdx !== -1 && row[phoneIdx] != null ? String(row[phoneIdx]).trim() : '';
        const rawAadhaar = aadhaarIdx !== -1 && row[aadhaarIdx] != null ? String(row[aadhaarIdx]).trim() : '';
        const rawVoterId = voterIdIdx !== -1 && row[voterIdIdx] != null ? String(row[voterIdIdx]).trim() : '';

        // Area: override or mapped from sheet
        let finalArea = '';
        if (selectedAreas.length > 0) {
          finalArea = selectedAreas.join(', ');
        } else if (rawArea) {
          finalArea = mapArea(rawArea);
        }

        // Booth No: override or matched from sheet
        let matchedBoothNo = '';
        if (selectedBooths.length > 0) {
          matchedBoothNo = selectedBooths.join(', ');
        } else if (rawBoothNo) {
          matchedBoothNo = rawBoothNo;
          const cleanRaw = rawBoothNo.replace(/\s+/g, '').toLowerCase();
          const found = booths.find((b: any) => b.boothNo && b.boothNo.replace(/\s+/g, '').toLowerCase() === cleanRaw);
          if (found) {
            matchedBoothNo = found.boothNo;
          }
        }

        // Clean values
        const cleanPhone = rawPhone.replace(/\.0$/, '').replace(/\s+/g, '');
        const cleanAadhaar = rawAadhaar.replace(/\s+/g, ' ');
        const cleanVoterId = rawVoterId;
        const cleanMemberId = rawVoterId;

        return {
          name: cleanRomanize(rawName),
          fatherName: cleanRomanize(rawFatherName),
          role: translateRole(rawRole),
          area: finalArea,
          boothNo: matchedBoothNo,
          phone: cleanPhone,
          aadhaarNumber: cleanAadhaar,
          memberId: cleanMemberId,
          voterId: cleanVoterId,
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
      setImportError("Please select an Organizational Unit");
      return;
    }

    setImportError(null);
    setDuplicateErrors([]);
    try {
      const finalPayload = parsedCadres.map((c, idx) => {
        // Exclude fatherName from finalPayload until fatherName is added to Prisma schema
        const { fatherName, ...rest } = c;
        const voterVal = rest.voterId?.trim() || '';
        const memberVal = rest.memberId?.trim() || voterVal;

        return {
          ...rest,
          phone: rest.phone?.trim() || undefined,
          aadhaarNumber: rest.aadhaarNumber?.trim() || undefined,
          voterId: voterVal || undefined,
          memberId: memberVal || `TVK-M-${Date.now().toString().slice(-6)}-${idx + 1}`,
          level: importLevel as any,
          unionId: importUnionId || undefined,
          homeKilaiId: importKilaiId || undefined,
        };
      });
      
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
    newCadres[index] = { ...rest };
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

  const handleAreaChange = (newAreas: string[]) => {
    setSelectedAreas(newAreas);
    applyOverrides(newAreas, selectedBooths);
  };

  const handleBoothChange = (newBooths: string[]) => {
    setSelectedBooths(newBooths);
    applyOverrides(selectedAreas, newBooths);
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
                  onChange={handleAreaChange}
                  displayStyle="badges"
                />
              </div>

              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                <Label>Booth (Optional)</Label>
                <BoothMultiSelect
                  value={selectedBooths}
                  onChange={handleBoothChange}
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
                    <li key={i}>{err.name} {err.reason ? `(${err.reason})` : ''}</li>
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
              <Table className="w-full min-w-[850px]">
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead className="font-semibold text-primary py-4">Name</TableHead>
                    <TableHead className="font-semibold text-primary py-4">Father&apos;s Name</TableHead>
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
                      <TableCell className="p-3 text-muted-foreground">{cadre.fatherName || '-'}</TableCell>
                      <TableCell className="p-3">{cadre.role || '-'}</TableCell>
                      <TableCell className="p-3">{cadre.area || '-'}</TableCell>
                      <TableCell className="p-3">{cadre.boothNo || '-'}</TableCell>
                      <TableCell className="p-3">{cadre.phone || '-'}</TableCell>
                      <TableCell className="p-3">{cadre.aadhaarNumber || '-'}</TableCell>
                      <TableCell className="p-3">{cadre.voterId || '-'}</TableCell>
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Administrator</DialogTitle>
          </DialogHeader>
          {editingRow && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name <span className="text-red-500">*</span></Label>
                  <Input value={editingRow.name} onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Father&apos;s Name</Label>
                  <Input value={editingRow.fatherName || ''} onChange={(e) => setEditingRow({ ...editingRow, fatherName: e.target.value })} placeholder="Father's name" />
                </div>
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
                  <Input value={editingRow.phone || ''} onChange={(e) => setEditingRow({ ...editingRow, phone: e.target.value })} />
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
                  <Input value={editingRow.aadhaarNumber || ''} onChange={(e) => setEditingRow({ ...editingRow, aadhaarNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Voter ID</Label>
                  <Input value={editingRow.voterId || ''} onChange={(e) => setEditingRow({ ...editingRow, voterId: e.target.value, memberId: e.target.value })} />
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
