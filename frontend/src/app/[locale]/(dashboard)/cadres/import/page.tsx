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
import { UploadCloud, AlertCircle, ArrowLeft, Edit2, Trash2, CheckCircle2, ChevronsUpDown, Check } from "lucide-react";
import { useCreateBulkCadres } from '@/hooks/use-cadres';
import { useUnions } from '@/hooks/use-unions';
import { useKilais } from '@/hooks/use-kilais';
import { useBooths, useBoothAreas } from '@/hooks/use-booths';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { romanize } from 'tamil-romanizer';
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
  
  // Dialog Edit State
  const [editingRow, setEditingRow] = useState<(CreateCadreDto & { index: number }) | null>(null);

  const { data: unions = [] } = useUnions();
  const { data: kilais = [] } = useKilais();
  const { data: booths = [] } = useBooths();
  const bulkCreateMutation = useCreateBulkCadres();
  
  const [boothOpen, setBoothOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const { data: allAreas = [] } = useBoothAreas();

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
          if (lower.includes('உறுப்பினர்')) return 'Executive Committee Member';
          return role;
        };

        const cleanRomanize = (text: string) => {
          if (!text) return '';
          try {
            const tamilRegex = /[\u0B80-\u0BFF]/;
            if (tamilRegex.test(text)) {
              let res = romanize(text);
              res = res.replace(/pira/g, 'pra')
                       .replace(/thira/g, 'thra')
                       .replace(/kira/g, 'kra')
                       .replace(/sira/g, 'sra')
                       .replace(/kiru/g, 'kri')
                       .replace(/bha/g, 'ba')
                       .replace(/dha/g, 'da')
                       .replace(/gha/g, 'ga');
              res = res.replace(/aa/g, 'a')
                       .replace(/ee/g, 'e')
                       .replace(/oo/g, 'o')
                       .replace(/ii/g, 'i')
                       .replace(/uu/g, 'u');
              res = res.split(' ').map((w: any) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return res;
            }
            return text;
          } catch (e) {
            return text;
          }
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
          let rawBoothNo = row[4]?.toString() || '';
          let matchedBoothNo = rawBoothNo;
          if (rawBoothNo) {
            const cleanRaw = rawBoothNo.replace(/\s+/g, '').toLowerCase();
            const found = booths.find((b: any) => b.boothNo.replace(/\s+/g, '').toLowerCase() === cleanRaw);
            if (found) {
              matchedBoothNo = found.boothNo;
            }
          }

          return {
            name: cleanRomanize(row[1]?.toString() || ''),
            role: translateRole(row[2]?.toString() || ''),
            area: mapArea(row[3]?.toString() || ''),
            boothNo: matchedBoothNo,
          phone: row[5]?.toString() || '',
          aadhaarNumber: row[6]?.toString() || '',
          memberId: row[7]?.toString() || '',
          voterId: row[7]?.toString() || '',
            level: importLevel as any,
            unionId: importUnionId || undefined,
            homeKilaiId: importKilaiId || undefined,
          };
        });
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
        setImportError(data?.message || error.message || "Failed to import cadres");
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/cadres" className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-xl md:text-2xl lg:text-3xl font-heading font-bold text-gray-900">Import Cadres</h1>
            <p className="text-muted-foreground font-medium mt-1">
              Upload an Excel/CSV file to bulk import cadres
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Level Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Import Level</Label>
              <Select value={importLevel} onValueChange={(value) => setImportLevel(value || '')}>
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
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <Label>Select Union</Label>
                <Select value={importUnionId} onValueChange={(value) => setImportUnionId(value || '')}>
                  <SelectTrigger className="w-full text-base">
                    <SelectValue placeholder="Select Union">
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
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <Label>Select Kilai</Label>
                <Select value={importKilaiId} onValueChange={(value) => setImportKilaiId(value || '')}>
                  <SelectTrigger className="w-full text-base">
                    <SelectValue placeholder="Select Kilai">
                      {importKilaiId ? kilais.find((k: any) => String(k.id) === importKilaiId)?.name : undefined}
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

          {/* Upload Area */}
          <div className="space-y-2">
            <Label>Upload Excel File</Label>
            <label className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-primary/30 rounded-lg cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
              <div className="flex flex-col items-center justify-center ">
                <UploadCloud className="w-8 text-primary/60" />
                <p className=" text-sm text-foreground font-semibold"><span className="text-primary">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-muted-foreground">.xlsx or .xls files only</p>
              </div>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>
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
            <h3 className="font-bold text-lg text-gray-900">Preview ({parsedCadres.length} cadres)</h3>
            <Button onClick={handleBulkSubmit} disabled={bulkCreateMutation.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {bulkCreateMutation.isPending ? 'Importing...' : 'Submit Cadres'}
            </Button>
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
                    <TableHead className="font-semibold text-primary py-4">Member ID</TableHead>
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
                      <TableCell className="p-3">{cadre.memberId}</TableCell>
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

      {/* Edit Cadre Dialog */}
      <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Cadre</DialogTitle>
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
                <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                  <PopoverTrigger role="combobox" aria-expanded={areaOpen} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50", !editingRow.area && "text-muted-foreground")}>
                    {editingRow.area ? editingRow.area : "Select place / area"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="p-0" style={{ width: 'var(--anchor-width)' }}>
                    <Command>
                      <CommandInput placeholder="Search area..." />
                      <CommandList>
                        <CommandEmpty>No area found.</CommandEmpty>
                        <CommandGroup>
                          {allAreas.map((area: string) => (
                            <CommandItem
                              key={area}
                              value={area}
                              onSelect={(currentValue) => {
                                const selectedArea = allAreas.find((a: string) => a.toLowerCase() === currentValue) || currentValue;
                                setEditingRow({ ...editingRow, area: selectedArea });
                                setAreaOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", editingRow.area === area ? "opacity-100" : "opacity-0")} />
                              {area}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 flex flex-col">
                <Label>Booth No</Label>
                <Popover open={boothOpen} onOpenChange={setBoothOpen}>
                  <PopoverTrigger role="combobox" aria-expanded={boothOpen} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50", !editingRow.boothNo && "text-muted-foreground")}>
                    {editingRow.boothNo ? (
                      (() => {
                        const selected = booths.find((b: any) => b.boothNo === editingRow.boothNo);
                        return selected ? `${selected.boothNo} - ${selected.area || selected.name}` : editingRow.boothNo;
                      })()
                    ) : "Select booth"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="p-0" style={{ width: 'var(--anchor-width)' }}>
                    <Command>
                      <CommandInput placeholder="Search booth..." />
                      <CommandList>
                        <CommandEmpty>No booth found.</CommandEmpty>
                        <CommandGroup>
                          {booths.map((booth: any) => (
                            <CommandItem
                              key={booth.id}
                              value={booth.boothNo}
                              onSelect={(currentValue) => {
                                const selectedBooth = booths.find((b: any) => b.boothNo.toLowerCase() === currentValue) || { boothNo: currentValue };
                                setEditingRow({ ...editingRow, boothNo: selectedBooth.boothNo });
                                setBoothOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", editingRow.boothNo === booth.boothNo ? "opacity-100" : "opacity-0")} />
                              {booth.boothNo} - {booth.area || booth.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aadhaar</Label>
                  <Input value={editingRow.aadhaarNumber} onChange={(e) => setEditingRow({ ...editingRow, aadhaarNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Member ID</Label>
                  <Input value={editingRow.memberId} onChange={(e) => setEditingRow({ ...editingRow, memberId: e.target.value })} />
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
