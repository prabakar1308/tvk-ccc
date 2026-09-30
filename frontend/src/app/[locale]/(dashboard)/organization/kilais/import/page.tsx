'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { UploadCloud, ArrowLeft, FileText, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/contexts/user-context';
import { kilaiApi } from '@/services/api/kilais';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnions } from '@/hooks/use-unions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import * as XLSX from 'xlsx';

interface ImportedKilai {
  id: string;
  name: string;
  tamilName: string;
  secretaryName: string;
  panchayat: string;
  code: string;
  phone: string;
  email: string;
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

  useEffect(() => {
    if (activeUnionId && !selectedUnionId) {
      setSelectedUnionId(activeUnionId);
    }
  }, [activeUnionId, selectedUnionId]);

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
          const data = XLSX.utils.sheet_to_json(ws);
          
          const parsedData = data.map((row: any) => ({
            id: Math.random().toString(36).substring(7),
            name: row['Name'] || row['name'] || '',
            tamilName: row['Tamil Name'] || row['tamilName'] || '',
            secretaryName: row['Secretary Name'] || row['secretaryName'] || '',
            panchayat: row['Panchayat'] || row['panchayat'] || '',
            code: row['Code'] || row['code'] || '',
            phone: row['Phone'] || row['phone'] || '',
            email: row['Email'] || row['email'] || '',
          }));
          setImportedData(parsedData);
        } catch (err) {
          setStatus('error');
          setErrorMessage('Failed to parse file. Please ensure it is a valid Excel or CSV file.');
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const updateRow = (id: string, field: keyof ImportedKilai, value: string) => {
    setImportedData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const deleteRow = (id: string) => {
    setImportedData(prev => prev.filter(row => row.id !== id));
  };

  const handleUpload = async () => {
    if (!file || importedData.length === 0) return;
    
    if (!selectedUnionId) {
      setStatus('error');
      setErrorMessage('Please select an Org Unit (Union) before importing.');
      return;
    }

    setStatus('uploading');

    try {
      // Loop and create Kilais
      for (const row of importedData) {
        if (!row.name) continue; // skip empty
        await kilaiApi.create({
          name: row.name,
          tamilName: row.tamilName,
          secretaryName: row.secretaryName,
          panchayat: row.panchayat,
          phone: row.phone,
          email: row.email,
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex items-center gap-4 border-b pb-4 border-border/50">
        <Button variant="ghost" size="icon" asChild className="shrink-0 text-muted-foreground hover:text-foreground">
          <Link href="/organization/kilais">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wide text-primary">Import Kilai List</h1>
          <p className="text-muted-foreground mt-1 font-medium">Upload an Excel file to bulk import Kilais into the system.</p>
        </div>
      </div>

      <Card className="border-primary/20 shadow-sm">
        <CardContent className="p-8">
          <div className="space-y-8">
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary font-heading flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">1</span>
                  Select Org Unit (Union)
                </h3>
                <div className="pl-8">
                  <Select value={selectedUnionId} onValueChange={setSelectedUnionId} disabled={isLoadingUnions}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Union" />
                    </SelectTrigger>
                    <SelectContent>
                      {unions?.map(union => (
                        <SelectItem key={union.id} value={union.id}>{union.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary font-heading flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">2</span>
                  Upload file
                </h3>
                
                <div className="pl-8">
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
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
                      {file ? (
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
              </div>
            </div>

            {importedData.length > 0 && status !== 'success' && (
              <div className="space-y-4 pt-6 border-t border-border/50">
                <h3 className="text-lg font-semibold text-primary font-heading flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">3</span>
                  Review & Edit Data ({importedData.length} rows)
                </h3>
                
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[150px]">Tamil Name</TableHead>
                        <TableHead className="min-w-[150px]">Secretary</TableHead>
                        <TableHead className="min-w-[150px]">Panchayat</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedData.map(row => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Input value={row.name} onChange={(e) => updateRow(row.id, 'name', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.tamilName} onChange={(e) => updateRow(row.id, 'tamilName', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.secretaryName} onChange={(e) => updateRow(row.id, 'secretaryName', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.panchayat} onChange={(e) => updateRow(row.id, 'panchayat', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteRow(row.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

            <div className="pt-4 flex gap-3">
              <Button 
                className="bg-manjal hover:bg-manjal/90 text-black font-semibold min-w-[120px] h-11 px-6 rounded-lg" 
                disabled={importedData.length === 0 || status === 'uploading' || status === 'success'}
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
                  <Link href="/organization/kilais">Return to List</Link>
                </Button>
              )}
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
