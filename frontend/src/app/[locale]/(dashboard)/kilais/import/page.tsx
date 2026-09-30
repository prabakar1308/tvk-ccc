'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { UploadCloud, ArrowLeft, FileText, CheckCircle2, AlertCircle, Loader2, Trash2, Edit2, Check, X } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/contexts/user-context';
import { kilaiApi } from '@/services/api/kilais';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnions } from '@/hooks/use-unions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import { cleanRomanize } from '@/lib/utils';
import { BoothMultiSelect } from '@/components/shared/booth-multi-select';
import { AreaMultiSelect } from '@/components/shared/area-multi-select';

interface ImportedKilai {
  id: string;
  name: string;
  secretaryName: string;
  panchayat: string;
  code: string;
  phone: string;
  email: string;
  linkedBooths: string;
  villages: string;
}

export default function ImportKilaisPage() {
  const t = useTranslations('Index');
  const router = useRouter();
  const { activeUnionId } = useUser();
  const { data: unions, isLoading: isLoadingUnions } = useUnions();
  
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedUnionId, setSelectedUnionId] = useState<string>('');
  const [importedData, setImportedData] = useState<ImportedKilai[]>([]);
  const [editingRow, setEditingRow] = useState<(ImportedKilai & { index: number }) | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (activeUnionId && !selectedUnionId) {
      setSelectedUnionId(activeUnionId);
    }
  }, [activeUnionId, selectedUnionId]);

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      "Sno": "",
      "Kilai Name": "",
      "Booth No": "",
      "Village/Areas": "",
      "Panchayat": "",
      "Secretary Name": "",
      "Contact": ""
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Kilai_Import_Template.xlsx');
  };

  const processKilaiData = (data: any[][], isPasted: boolean = false) => {
    try {
      let headerRowIndex = -1;
      for (let i = 0; i < data.length; i++) {
         if (data[i] && data[i].some((cell: any) => cell !== null && cell !== undefined && cell !== '')) {
             headerRowIndex = i;
             break;
         }
      }

      if (headerRowIndex === -1) {
         throw new Error("No data found in the provided content.");
      }

      let headers: string[] = [];
      let dataRows: any[][] = [];
      
      const firstRowStr = data[headerRowIndex].join('').toLowerCase().replace(/[^a-z0-9]/g, '');
      const hasHeaderKeywords = firstRowStr.includes('kilainame') || firstRowStr.includes('name') || firstRowStr.includes('boothno') || firstRowStr.includes('village') || firstRowStr.includes('panchayat') || firstRowStr.includes('secretary') || firstRowStr.includes('sno');

      if (isPasted && !hasHeaderKeywords) {
          dataRows = data.slice(headerRowIndex);
      } else {
          if (headerRowIndex === data.length - 1) {
             throw new Error("No data rows found below the header in the provided content.");
          }
          headers = data[headerRowIndex].map((h: any) => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
          dataRows = data.slice(headerRowIndex + 1);
      }
      
      const parsedData = dataRows.map((rawRow: any[]) => {
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
           if (h) {
               row[h] = rawRow[i];
           }
        });

        const rawName = String(row['kilainame'] || row['name'] || rawRow[1] || '').trim();
        const rawLinkedBooths = String(row['boothno'] || row['linkedbooths'] || rawRow[2] || '').trim();
        const rawVillages = String(row['villageareas'] || row['village'] || row['villages'] || rawRow[3] || '').trim();
        const rawPanchayat = String(row['panchayat'] || rawRow[4] || '').trim();
        const rawSecName = String(row['secretaryname'] || row['secretary'] || rawRow[5] || '').trim();
        const rawPhone = String(row['contact'] || row['phone'] || rawRow[6] || '').trim();
        
        return {
          id: Math.random().toString(36).substring(7),
          name: /[\u0B80-\u0BFF]/.test(rawName) ? cleanRomanize(rawName) : rawName,
          secretaryName: /[\u0B80-\u0BFF]/.test(rawSecName) ? cleanRomanize(rawSecName) : rawSecName,
          panchayat: /[\u0B80-\u0BFF]/.test(rawPanchayat) ? cleanRomanize(rawPanchayat) : rawPanchayat,
          linkedBooths: /[\u0B80-\u0BFF]/.test(rawLinkedBooths) ? cleanRomanize(rawLinkedBooths) : rawLinkedBooths,
          villages: /[\u0B80-\u0BFF]/.test(rawVillages) ? cleanRomanize(rawVillages) : rawVillages,
          phone: /[\u0B80-\u0BFF]/.test(rawPhone) ? cleanRomanize(rawPhone) : rawPhone,
          code: String(row['code'] || '').trim(),
          email: String(row['email'] || '').trim(),
        };
      }).filter(r => r.name || r.linkedBooths || r.villages || r.panchayat);
      
      if (parsedData.length === 0) {
         throw new Error("No valid data rows found. Ensure the data has headers that match the template.");
      }

      setImportedData(parsedData);
      setStatus('idle');
      setErrorMessage('');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to parse data.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage('');
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          processKilaiData(data);
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to parse file. Please ensure it is a valid Excel or CSV file.');
        }
      };
      reader.readAsBinaryString(selectedFile);
      e.target.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;

    const rows = clipboardData.split('\n').filter(row => row.trim() !== '');
    const dataArray = rows.map(row => row.split('\t'));
    
    setFile(new File([], "Pasted Data", { type: "text/plain" }));
    processKilaiData(dataArray, true);
  };

  const updateRow = (id: string, field: keyof ImportedKilai, value: string) => {
    setImportedData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setImportedData(prev => prev.filter(row => row.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const handleSaveEdit = () => {
    if (!editingRow) return;
    const { index, ...rest } = editingRow;
    const newData = [...importedData];
    newData[index] = rest as ImportedKilai;
    setImportedData(newData);
    setEditingRow(null);
  };

  const handleUpload = async () => {
    if (!file || importedData.length === 0) return;
    
    if (!selectedUnionId) {
      setStatus('error');
      setErrorMessage('Please select an Org Unit before importing.');
      return;
    }

    setStatus('uploading');

    try {
      // Loop and create Kilais
      for (const row of importedData) {
        if (!row.name) continue; // skip empty
        await kilaiApi.create({
          name: row.name,
          secretaryName: row.secretaryName,
          panchayat: row.panchayat,
          phone: row.phone,
          email: row.email,
          linkedBooths: row.linkedBooths ? row.linkedBooths.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          villages: row.villages ? row.villages.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          unionId: selectedUnionId,
          status: 'ACTIVE',
        });
      }
      
      setStatus('success');
    } catch (error: any) {
      console.error('Upload failed:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to process the import list.');
    }
  };

  return (
    <div className="mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex items-center gap-4 border-b pb-4 border-border/50">
        <Button variant="ghost" size="icon" asChild className="shrink-0 text-muted-foreground hover:text-foreground">
          <Link href="/kilais">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wide text-primary">Import Kilai List</h1>
          <p className="text-muted-foreground mt-1 font-medium">Upload an Excel file to bulk import Kilais into the system.</p>
        </div>
        <Button onClick={handleDownloadTemplate} variant="outline" className="ml-auto hidden sm:flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      <Card className="border-primary/20 shadow-sm">
        <CardContent className="p-8">
          <div className="space-y-8">
            
            <div className="flex flex-col gap-8 border-b pb-8 border-border/50">
              <div className="space-y-4 md:w-1/2 pr-4">
                <h3 className="text-lg font-semibold text-primary font-heading flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">1</span>
                  Select Org Unit
                </h3>
                <div className="pl-8">
                  <Select value={selectedUnionId} onValueChange={(value) => setSelectedUnionId(value ?? '')} disabled={isLoadingUnions}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Org Unit">
                        {(val) => val ? unions?.find(u => u.id === val)?.name : "Select a Org Unit"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {unions?.map(union => (
                        <SelectItem key={union.id} value={union.id} label={union.name}>{union.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary font-heading flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">2</span>
                  Upload or Paste Data
                </h3>
                
                <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Upload Excel File</Label>
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors h-[160px] flex flex-col justify-center ${
                      file && file.name !== "Pasted Data" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                        <div className="p-3 bg-background rounded-full shadow-sm border border-border">
                          <UploadCloud className="w-6 h-6 text-primary" />
                        </div>
                        {file && file.name !== "Pasted Data" ? (
                          <div className="space-y-1 text-center">
                            <p className="text-sm font-semibold text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        ) : (
                          <div className="space-y-1 text-center">
                            <p className="text-sm font-medium text-foreground">Click to upload</p>
                            <p className="text-xs text-muted-foreground">Excel or CSV</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Paste Data from Excel</Label>
                    <textarea 
                      onPaste={handlePaste}
                      placeholder="Click here and press Ctrl+V to paste cells directly from Excel..."
                      className="w-full h-[160px] p-4 text-sm bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none placeholder:text-center placeholder:pt-[45px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {importedData.length > 0 && status !== 'success' && (
              <div className="space-y-4 pt-6 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary font-heading flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">3</span>
                    Review & Edit Data ({importedData.length} rows)
                  </h3>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => {
                    setImportedData([]);
                    setFile(null);
                    setStatus('idle');
                  }}>
                    Clear Data
                  </Button>
                </div>
                
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[120px]">Booth No</TableHead>
                        <TableHead className="min-w-[150px]">Village/Areas</TableHead>
                        <TableHead className="min-w-[150px]">Panchayat</TableHead>
                        <TableHead className="min-w-[150px]">Secretary</TableHead>
                        <TableHead className="min-w-[120px]">Contact</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedData.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.linkedBooths}</TableCell>
                          <TableCell>{row.villages}</TableCell>
                          <TableCell>{row.panchayat}</TableCell>
                          <TableCell>{row.secretaryName}</TableCell>
                          <TableCell>{row.phone}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setEditingRow({ ...row, index })}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteConfirmId(row.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-4 p-3 rounded bg-red-50 border border-red-100 flex items-start gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="mt-4 p-3 rounded bg-green-50 border border-green-100 flex items-start gap-2 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Import successful!</p>
                  <p>The Kilai list has been processed and added to the selected org unit.</p>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <Button 
                className="bg-manjal hover:bg-manjal/90 text-black font-semibold min-w-[120px] h-11 px-6 rounded-lg" 
                disabled={importedData.length === 0 || !selectedUnionId || status === 'uploading' || status === 'success'}
                onClick={handleUpload}
              >
                {status === 'uploading' ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  'Submit Import'
                )}
              </Button>
              {status === 'success' && (
                <Button variant="outline" className="h-11 px-6 rounded-lg" asChild>
                  <Link href="/kilais">Return to List</Link>
                </Button>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this row? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Kilai</DialogTitle>
          </DialogHeader>
          {editingRow && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={editingRow.name} onChange={(e) => setEditingRow({...editingRow, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Booth No</Label>
                <BoothMultiSelect
                  value={editingRow.linkedBooths ? editingRow.linkedBooths.split(',').map(s=>s.trim()).filter(Boolean) : []}
                  onChange={(val) => setEditingRow({...editingRow, linkedBooths: val.join(', ')})}
                  displayStyle="badges"
                />
              </div>
              <div className="grid gap-2">
                <Label>Village/Areas</Label>
                <AreaMultiSelect
                  value={editingRow.villages ? editingRow.villages.split(',').map(s=>s.trim()).filter(Boolean) : []}
                  onChange={(val) => setEditingRow({...editingRow, villages: val.join(', ')})}
                  displayStyle="badges"
                />
              </div>
              <div className="grid gap-2">
                <Label>Panchayat</Label>
                <Input value={editingRow.panchayat} onChange={(e) => setEditingRow({...editingRow, panchayat: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Secretary Name</Label>
                <Input value={editingRow.secretaryName} onChange={(e) => setEditingRow({...editingRow, secretaryName: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Contact</Label>
                <Input value={editingRow.phone} onChange={(e) => setEditingRow({...editingRow, phone: e.target.value})} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRow(null)}>Cancel</Button>
            <Button className="bg-manjal hover:bg-manjal/90 text-black" onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
