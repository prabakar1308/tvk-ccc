'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Users,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Download,
  Loader2,
  ArrowRight,
  ClipboardPaste,
  FileText,
  X,
  RefreshCw,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import * as XLSX from 'xlsx';
import { Booth, BoothDemographicsItem } from '@/services/api/booths';
import { useUpdateBoothDemographicsBulk } from '@/hooks/use-booths';

export interface ParsedDemographicsRow {
  id: string; // unique row id
  boothNo: string;
  maleCount: number;
  femaleCount: number;
  thirdGenderCount: number;
  totalCount: number;
  matchedBooth?: Booth;
  status: 'matched' | 'not_found' | 'invalid';
  warningMessage?: string;
}

export interface ImportDemographicsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booths: Booth[];
  onSuccess?: () => void;
}

export function ImportDemographicsDialog({
  open,
  onOpenChange,
  booths,
  onSuccess,
}: ImportDemographicsDialogProps) {
  const locale = useLocale();
  const updateBulk = useUpdateBoothDemographicsBulk();

  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedDemographicsRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'ready' | 'issues'>('all');
  const [successResult, setSuccessResult] = useState<{
    updatedCount: number;
    notFound: string[];
  } | null>(null);

  // Quick lookup map for existing booths
  const boothLookup = useMemo(() => {
    const map = new Map<string, Booth>();
    for (const b of booths || []) {
      const bNo = String(b.boothNo || '').trim();
      map.set(bNo, b);
      map.set(bNo.toLowerCase(), b);
      const noZero = bNo.replace(/^0+/, '');
      if (noZero) map.set(noZero, b);
    }
    return map;
  }, [booths]);

  // Reset dialog state
  const handleReset = () => {
    setPasteText('');
    setFileName(null);
    setParsedRows([]);
    setParseError(null);
    setSuccessResult(null);
    setFilterTab('all');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  // Generate and download sample Excel template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'Booth No': '1',
        Male: 450,
        Female: 470,
        '3rd': 2,
        Total: 922,
      },
      {
        'Booth No': '2',
        Male: 510,
        Female: 525,
        '3rd': 0,
        Total: 1035,
      },
      {
        'Booth No': '3',
        Male: 380,
        Female: 395,
        '3rd': 1,
        Total: 776,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    // Set column widths
    ws['!cols'] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Demographics');
    XLSX.writeFile(wb, 'Booth_Demographics_Template.xlsx');
  };

  // Helper to parse raw 2D array from Excel or TSV
  const processRawData = (data: any[][], sourceName: string) => {
    try {
      setParseError(null);
      setSuccessResult(null);

      // Filter out completely empty rows
      const nonEmptyRows = data.filter(
        (row) =>
          Array.isArray(row) &&
          row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
      );

      if (nonEmptyRows.length === 0) {
        throw new Error(
          locale === 'ta'
            ? 'வழங்கப்பட்ட தகவலில் எந்த தரவும் இல்லை.'
            : 'No data found in the provided content.'
        );
      }

      // Detect header row
      let headerIndex = -1;
      const colMap = {
        boothNo: -1,
        boothName: -1,
        male: -1,
        female: -1,
        third: -1,
        total: -1,
      };

      for (let i = 0; i < Math.min(5, nonEmptyRows.length); i++) {
        const rowStr = nonEmptyRows[i]
          .map((c) => String(c ?? '').toLowerCase().trim())
          .join(' ');

        if (
          rowStr.includes('booth') ||
          rowStr.includes('male') ||
          rowStr.includes('female') ||
          rowStr.includes('total') ||
          rowStr.includes('வாக்குச்சாவடி') ||
          rowStr.includes('ஆண்') ||
          rowStr.includes('பெண்') ||
          rowStr.includes('மொத்தம்')
        ) {
          headerIndex = i;
          // Map columns supporting English and Tamil
          nonEmptyRows[i].forEach((col: any, idx: number) => {
            const raw = String(col ?? '').trim().toLowerCase();
            const cleanAscii = raw.replace(/[^a-z0-9]/g, '');

            // 1. Female (check before male so 'female' does not match 'male')
            if (
              raw.includes('female') ||
              raw.includes('women') ||
              raw.includes('பெண்') ||
              raw.includes('பெண்கள்') ||
              cleanAscii === 'f' ||
              cleanAscii === 'w'
            ) {
              if (colMap.female === -1) colMap.female = idx;
            }
            // 2. Male
            else if (
              raw.includes('male') ||
              raw.includes('men') ||
              raw.includes('ஆண்') ||
              raw.includes('ஆண்கள்') ||
              cleanAscii === 'm'
            ) {
              if (colMap.male === -1) colMap.male = idx;
            }
            // 3. 3rd Gender (3rd / third / trans / tg / other / 3 / 3ம் / மூன்றாம்)
            else if (
              raw.includes('3rd') ||
              raw.includes('third') ||
              raw.includes('trans') ||
              raw.includes('tg') ||
              raw.includes('other') ||
              raw.includes('3ம்') ||
              raw.includes('3-ம்') ||
              raw.includes('மூன்றாம்') ||
              raw.includes('திருநங்கை') ||
              cleanAscii === '3' ||
              cleanAscii === '3rd' ||
              cleanAscii === 'tg'
            ) {
              if (colMap.third === -1) colMap.third = idx;
            }
            // 4. Total (must not clash with 3rd or others)
            else if (
              raw.includes('total') ||
              raw.includes('tot') ||
              raw.includes('sum') ||
              raw.includes('grand') ||
              raw.includes('மொத்தம்')
            ) {
              if (colMap.total === -1) colMap.total = idx;
            }
            // 5. Booth Name / Location
            else if (
              (raw.includes('name') || raw.includes('பெயர்') || raw.includes('location')) &&
              !raw.includes('no') &&
              !raw.includes('எண்')
            ) {
              if (colMap.boothName === -1) colMap.boothName = idx;
            }
            // 6. Booth No
            else if (
              raw.includes('booth') ||
              raw.includes('station') ||
              raw.includes('வ.எண்') ||
              raw.includes('வஎண்') ||
              raw.includes('வாக்குச்சாவடி') ||
              cleanAscii === 'no' ||
              cleanAscii === 'bno' ||
              cleanAscii === 'psno' ||
              (idx === 0 && (raw.includes('எண்') || cleanAscii === 'sno' || cleanAscii === 'slno'))
            ) {
              if (colMap.boothNo === -1) colMap.boothNo = idx;
            }
          });
          break;
        }
      }

      // Default boothNo if not identified
      if (colMap.boothNo === -1) colMap.boothNo = 0;
      // Guard against collision: total and third must never share the same index
      if (colMap.total !== -1 && colMap.total === colMap.third) {
        colMap.third = -1;
      }

      const hasCompleteHeader =
        headerIndex !== -1 &&
        colMap.male !== -1 &&
        colMap.female !== -1 &&
        colMap.male !== colMap.female &&
        colMap.male !== colMap.third &&
        colMap.female !== colMap.third &&
        colMap.total !== colMap.third;

      const dataRows = headerIndex !== -1 ? nonEmptyRows.slice(headerIndex + 1) : nonEmptyRows;
      const rows: ParsedDemographicsRow[] = [];

      dataRows.forEach((row, idx) => {
        const cells = row.map((c) => (c !== null && c !== undefined ? String(c).trim() : ''));
        if (cells.length === 0 || !cells.some(Boolean)) return;

        // Resolve booth number
        let rawBoothNo = '';
        if (colMap.boothNo !== -1 && cells[colMap.boothNo] !== undefined && cells[colMap.boothNo] !== '') {
          rawBoothNo = cells[colMap.boothNo];
        } else {
          rawBoothNo = cells[0] ?? '';
        }
        const cleanBoothNo = rawBoothNo.replace(/^#/, '').trim();
        if (!cleanBoothNo) return; // Skip empty booth number rows

        let male = 0;
        let female = 0;
        let third = 0;
        let total = 0;
        let parsedTotal: number | null = null;

        // If complete header is mapped and row has enough columns
        if (
          hasCompleteHeader &&
          cells.length > Math.max(colMap.male, colMap.female)
        ) {
          male = Math.max(0, parseInt(cells[colMap.male] ?? '0', 10) || 0);
          female = Math.max(0, parseInt(cells[colMap.female] ?? '0', 10) || 0);
          third =
            colMap.third !== -1 && cells[colMap.third] !== undefined && cells[colMap.third] !== ''
              ? Math.max(0, parseInt(cells[colMap.third] ?? '0', 10) || 0)
              : 0;

          if (colMap.total !== -1 && cells[colMap.total] !== undefined && cells[colMap.total] !== '') {
            const pt = parseInt(cells[colMap.total], 10);
            if (!isNaN(pt)) parsedTotal = pt;
          }

          const sum = male + female + third;
          total = parsedTotal !== null && !isNaN(parsedTotal) && parsedTotal > 0 ? parsedTotal : sum;
        } else {
          // Dynamic numeric column resolution (works for 4 cols, 5 cols, 6 cols with Booth Name, etc.)
          const numCells: { val: number; origIdx: number }[] = [];
          cells.forEach((cell, cellIdx) => {
            if (cellIdx !== colMap.boothNo) {
              const s = String(cell ?? '').trim();
              if (s !== '' && !isNaN(Number(s))) {
                numCells.push({ val: Math.max(0, parseInt(s, 10) || 0), origIdx: cellIdx });
              }
            }
          });

          if (numCells.length >= 4) {
            const n1 = numCells[0].val; // Male
            const n2 = numCells[1].val; // Female
            const n3 = numCells[2].val;
            const n4 = numCells[3].val;

            if (n4 === n1 + n2 + n3 || (n4 > n1 && n4 > n2)) {
              // Order: Booth, Male, Female, 3rd, Total
              male = n1;
              female = n2;
              third = n3;
              total = n4;
              parsedTotal = n4;
            } else if (n3 === n1 + n2 + n4 || (n3 > n1 && n3 > n2)) {
              // Order: Booth, Male, Female, Total, 3rd
              male = n1;
              female = n2;
              total = n3;
              third = n4;
              parsedTotal = n3;
            } else {
              // Default
              male = n1;
              female = n2;
              third = n3;
              total = n4 > 0 ? n4 : n1 + n2 + n3;
              parsedTotal = n4 > 0 ? n4 : null;
            }
          } else if (numCells.length === 3) {
            const n1 = numCells[0].val; // Male
            const n2 = numCells[1].val; // Female
            const n3 = numCells[2].val;

            if (n3 === n1 + n2 || (n3 > n1 && n3 > n2 && n3 > 20)) {
              // Order: Booth, Male, Female, Total (3rd is omitted / 0)
              male = n1;
              female = n2;
              third = 0;
              total = n3;
              parsedTotal = n3;
            } else {
              // Order: Booth, Male, Female, 3rd (Total is calculated)
              male = n1;
              female = n2;
              third = n3;
              total = n1 + n2 + n3;
              parsedTotal = null;
            }
          } else if (numCells.length === 2) {
            // Booth, Male, Female
            male = numCells[0].val;
            female = numCells[1].val;
            third = 0;
            total = male + female;
            parsedTotal = null;
          }
        }

        const sumCalculated = male + female + third;
        if (total === 0) total = sumCalculated;

        // Find match in booths
        const matched =
          boothLookup.get(cleanBoothNo) ||
          boothLookup.get(cleanBoothNo.toLowerCase()) ||
          boothLookup.get(cleanBoothNo.replace(/^0+/, ''));

        let status: 'matched' | 'not_found' | 'invalid' = 'matched';
        let warningMessage: string | undefined;

        if (!matched) {
          status = 'not_found';
          warningMessage =
            locale === 'ta'
              ? 'வாக்குச்சாவடி எண் கணினியில் இல்லை'
              : 'Booth number not found in system';
        } else if (parsedTotal !== null && parsedTotal !== sumCalculated) {
          warningMessage =
            locale === 'ta'
              ? `வழங்கப்பட்ட மொத்தம் (${parsedTotal}) ஆ+பெ+3 கூட்டலுடன் (${sumCalculated}) வேறுபடுகிறது`
              : `Total (${parsedTotal}) differs from sum of Male+Female+3rd (${sumCalculated})`;
        }

        rows.push({
          id: `row-${idx}-${cleanBoothNo}`,
          boothNo: cleanBoothNo,
          maleCount: male,
          femaleCount: female,
          thirdGenderCount: third,
          totalCount: total,
          matchedBooth: matched,
          status,
          warningMessage,
        });
      });

      if (rows.length === 0) {
        throw new Error(
          locale === 'ta'
            ? 'செல்லுபடியாகும் வாக்குச்சாவடி விவரங்கள் எதுவும் கண்டறியப்படவில்லை.'
            : 'No valid booth demographic records could be extracted.'
        );
      }

      setParsedRows(rows);
      setFileName(sourceName);
    } catch (err: any) {
      console.error('Error parsing data:', err);
      setParseError(err.message || 'Failed to parse data');
      setParsedRows([]);
    }
  };

  // Handle file upload
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
        processRawData(data, file.name);
      } catch (err: any) {
        setParseError(err.message || 'Failed to read Excel file');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = '';
  };

  // Split text into 2D row/column grid (supporting Tabs, Commas, Multi-spaces, or single space)
  const splitTextToGrid = (text: string): string[][] => {
    const lines = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line) => {
      if (line.includes('\t')) {
        return line.split('\t').map((c) => c.trim());
      }
      if (line.includes(',')) {
        return line.split(',').map((c) => c.trim());
      }
      if (/\s{2,}/.test(line)) {
        return line.split(/\s{2,}/).map((c) => c.trim());
      }
      // Single space delimited if tokens look like [boothNo, num1, num2, ...]
      const parts = line.split(/\s+/);
      if (parts.length >= 3 && parts.slice(1).every((p) => !isNaN(Number(p)))) {
        return parts;
      }
      return [line];
    });
  };

  // Handle paste text parsing
  const handleParsePastedText = () => {
    if (!pasteText.trim()) return;
    const data = splitTextToGrid(pasteText);
    processRawData(data, 'Pasted Data');
  };

  // Handle direct paste event in textarea
  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    setPasteText(text);

    // Auto-parse on paste
    setTimeout(() => {
      const data = splitTextToGrid(text);
      processRawData(data, 'Pasted Data');
    }, 50);
  };

  // Remove a row from parsed data
  const handleRemoveRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = parsedRows.length;
    const ready = parsedRows.filter((r) => r.status === 'matched').length;
    const issues = parsedRows.filter((r) => r.status !== 'matched').length;
    const totalVoters = parsedRows
      .filter((r) => r.status === 'matched')
      .reduce((sum, r) => sum + r.totalCount, 0);

    return { total, ready, issues, totalVoters };
  }, [parsedRows]);

  // Filtered rows for preview table
  const displayedRows = useMemo(() => {
    if (filterTab === 'ready') return parsedRows.filter((r) => r.status === 'matched');
    if (filterTab === 'issues') return parsedRows.filter((r) => r.status !== 'matched');
    return parsedRows;
  }, [parsedRows, filterTab]);

  // Apply batch update
  const handleApplyUpdate = async () => {
    const matchedItems: BoothDemographicsItem[] = parsedRows
      .filter((r) => r.status === 'matched')
      .map((r) => ({
        boothNo: r.boothNo,
        maleCount: r.maleCount,
        femaleCount: r.femaleCount,
        thirdGenderCount: r.thirdGenderCount,
        totalCount: r.totalCount,
      }));

    if (matchedItems.length === 0) {
      alert(
        locale === 'ta'
          ? 'புதுப்பிக்க செல்லுபடியாகும் வாக்குச்சாவடிகள் எதுவும் இல்லை.'
          : 'No matched booths to update.'
      );
      return;
    }

    try {
      const res = await updateBulk.mutateAsync(matchedItems);
      setSuccessResult({
        updatedCount: res.updatedCount,
        notFound: res.notFound || [],
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Failed to update demographics:', err);
      alert(err.message || 'Failed to update demographics');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[780px] w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden !p-6 sm:!p-7 rounded-2xl shadow-2xl border border-primary/20 bg-background space-y-5">
        <DialogHeader className="space-y-3 pb-3 border-b border-primary/10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                  {locale === 'ta'
                    ? 'வாக்காளர் விவரங்கள் இறக்குமதி / நகல்-ஒட்டு'
                    : 'Import / Paste Vote Demographics'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === 'ta'
                    ? 'வாக்குச்சாவடி எண், ஆண், பெண், 3ம் பாலினம், மொத்த வாக்காளர் எண்ணிக்கையை ஒரே நேரத்தில் புதுப்பிக்கவும்.'
                    : 'Update Male, Female, 3rd Gender, and Total voter counts in bulk using Excel or Copy-Paste.'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs font-semibold gap-1.5 h-8 border-primary/20 hover:bg-primary/5"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>{locale === 'ta' ? 'மாதிரி படிவம்' : 'Download Template'}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Success Screen */}
        {successResult ? (
          <div className="py-8 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-foreground">
                {locale === 'ta'
                  ? 'வாக்காளர் விவரங்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!'
                  : 'Demographics Successfully Updated!'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {locale === 'ta'
                  ? `${successResult.updatedCount} வாக்குச்சாவடிகளுக்கான வாக்காளர் எண்ணிக்கை தகவல் புதுப்பிக்கப்பட்டுள்ளது.`
                  : `Successfully updated voter demographic numbers for ${successResult.updatedCount} booths.`}
              </p>
            </div>

            {successResult.notFound.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 max-w-md mx-auto text-left">
                <span className="font-bold">
                  {locale === 'ta' ? 'கணினியில் இல்லாத வாக்குச்சாவடிகள்:' : 'Skipped booths (not in system):'}{' '}
                </span>
                {successResult.notFound.join(', ')}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{locale === 'ta' ? 'இன்னொரு பட்டியல்' : 'Import Another'}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleClose}
                className="bg-primary text-white font-bold px-6"
              >
                {locale === 'ta' ? 'முடிந்தது' : 'Done'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Mode Switcher: File Upload vs Copy-Paste */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  inputMode === 'paste'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>{locale === 'ta' ? 'நகல்-ஒட்டு (Copy-Paste)' : 'Copy-Paste Text'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{locale === 'ta' ? 'கோப்பு பதிவேற்றம் (.xlsx / .csv)' : 'Upload Excel / CSV'}</span>
              </button>
            </div>

            {/* Input Section */}
            {inputMode === 'paste' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {locale === 'ta'
                      ? 'எக்செல்லிலிருந்து வரிகளை நேரடியாக இங்கே ஒட்டவும் (Ctrl+V):'
                      : 'Paste table cells directly from Excel or Google Sheets (Ctrl+V):'}
                  </span>
                  <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded">
                    Booth No [tab] Male [tab] Female [tab] 3rd [tab] Total
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    rows={5}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    onPaste={handleTextareaPaste}
                    placeholder={`Booth No\tMale\tFemale\t3rd\tTotal\n1\t450\t470\t2\t922\n2\t510\t525\t0\t1035`}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-primary/20 bg-zinc-50 dark:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                  />
                  {pasteText && (
                    <button
                      type="button"
                      onClick={() => setPasteText('')}
                      className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    {locale === 'ta'
                      ? 'குறிப்பு: தலைப்பு வரிசை இருந்தாலும் இல்லாவிட்டாலும் தானாகவே பிரித்தெடுக்கப்படும்.'
                      : 'Note: Works with or without header row. Tab-separated or comma-separated.'}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleParsePastedText}
                    disabled={!pasteText.trim()}
                    className="text-xs font-bold gap-1.5 h-8"
                  >
                    <span>{locale === 'ta' ? 'தரவை பகுப்பாய்வு செய்' : 'Parse Pasted Data'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-2xl p-6 text-center transition-colors bg-primary/5 cursor-pointer relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    id="excel-file-input"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-xl bg-background border border-primary/20 text-primary flex items-center justify-center shadow-xs">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">
                        {fileName || (locale === 'ta' ? 'எக்செல் கோப்பை தேர்வு செய்யவும்' : 'Click or drag Excel / CSV file here')}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        .xlsx, .xls, .csv &bull; Columns: Booth No, Male, Female, 3rd, Total
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parse Error Display */}
            {parseError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Parsed Preview Section */}
            {parsedRows.length > 0 && (
              <div className="space-y-3 pt-2">
                {/* KPI Metric Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {locale === 'ta' ? 'மொத்த வரிகள்' : 'Total Rows'}
                    </p>
                    <p className="text-base font-black font-mono mt-0.5 text-foreground">
                      {stats.total}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      {locale === 'ta' ? 'பொருந்தியவை' : 'Matched in System'}
                    </p>
                    <p className="text-base font-black font-mono mt-0.5 text-emerald-600 dark:text-emerald-400">
                      {stats.ready}
                    </p>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${
                    stats.issues > 0
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200'
                      : 'bg-muted/40 border-border text-muted-foreground'
                  }`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      {locale === 'ta' ? 'கணினியில் இல்லை' : 'Not in System'}
                    </p>
                    <p className="text-base font-black font-mono mt-0.5">
                      {stats.issues}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {locale === 'ta' ? 'மொத்த வாக்காளர்கள்' : 'Total Voters'}
                    </p>
                    <p className="text-base font-black font-mono mt-0.5 text-primary">
                      {stats.totalVoters.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Filter Tabs for Preview Table */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterTab('all')}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                        filterTab === 'all'
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      All ({stats.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('ready')}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                        filterTab === 'ready'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      Ready ({stats.ready})
                    </button>
                    {stats.issues > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterTab('issues')}
                        className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                          filterTab === 'issues'
                            ? 'bg-amber-600 text-white'
                            : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                        }`}
                      >
                        Issues ({stats.issues})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-muted-foreground">
                      {sourceFileNameDisplay(fileName, locale)}
                    </span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{locale === 'ta' ? 'அனைத்தையும் நீக்கு' : 'Clear All'}</span>
                    </button>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-border/80 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left divide-y divide-border table-fixed">
                    <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] font-bold sticky top-0 backdrop-blur-xs z-10">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3">Booth No</th>
                        <th className="py-2 px-3">Booth Name</th>
                        <th className="py-2 px-3 text-right">Male</th>
                        <th className="py-2 px-3 text-right">Female</th>
                        <th className="py-2 px-3 text-right">3rd</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-background font-mono">
                      {displayedRows.map((row, idx) => {
                        const isMatched = row.status === 'matched';
                        const mb = row.matchedBooth;

                        return (
                          <tr
                            key={row.id}
                            className={`hover:bg-muted/40 transition-colors ${
                              !isMatched ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-muted-foreground font-sans text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-bold text-foreground">
                              #{row.boothNo}
                            </td>
                            <td className="py-2 px-3 font-sans truncate max-w-[180px]">
                              {mb ? (
                                <span className="font-medium text-foreground truncate block" title={mb.name}>
                                  {mb.name}
                                </span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 italic text-[11px]">
                                  {locale === 'ta' ? 'கண்டறியப்படவில்லை' : 'Not found'}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right text-foreground">
                              <span>{row.maleCount}</span>
                              {mb && mb.maleCount !== row.maleCount && (
                                <span className="text-[10px] text-muted-foreground ml-1">
                                  ({mb.maleCount})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right text-foreground">
                              <span>{row.femaleCount}</span>
                              {mb && mb.femaleCount !== row.femaleCount && (
                                <span className="text-[10px] text-muted-foreground ml-1">
                                  ({mb.femaleCount})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right text-foreground">
                              <span>{row.thirdGenderCount}</span>
                              {mb && mb.thirdGenderCount !== row.thirdGenderCount && (
                                <span className="text-[10px] text-muted-foreground ml-1">
                                  ({mb.thirdGenderCount})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-primary">
                              <span>{row.totalCount}</span>
                              {mb && mb.totalCount !== row.totalCount && (
                                <span className="text-[10px] text-muted-foreground font-normal ml-1">
                                  ({mb.totalCount})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-sans">
                              {isMatched ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>{locale === 'ta' ? 'தயார்' : 'Ready'}</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 cursor-help"
                                  title={row.warningMessage}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>{locale === 'ta' ? 'இல்லை' : 'Missing'}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.id)}
                                className="text-muted-foreground hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                                title="Remove row"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {stats.issues > 0 && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {locale === 'ta'
                        ? `${stats.issues} வாக்குச்சாவடிகள் கணினியில் இல்லை. பொருந்திய ${stats.ready} வாக்குச்சாவடிகள் மட்டுமே புதுப்பிக்கப்படும்.`
                        : `${stats.issues} booth(s) are not registered in the system and will be skipped. Only the ${stats.ready} matched booths will be updated.`}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t border-primary/10 flex flex-row items-center justify-between w-full">
          <div>
            {!successResult && parsedRows.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={updateBulk.isPending}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 gap-1.5 h-8 px-2.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{locale === 'ta' ? 'அனைத்தையும் நீக்கு' : 'Clear All'}</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateBulk.isPending}
              className="text-xs font-semibold"
            >
              {locale === 'ta' ? 'ரத்து' : 'Cancel'}
            </Button>

            {!successResult && parsedRows.length > 0 && (
              <Button
                type="button"
                onClick={handleApplyUpdate}
                disabled={updateBulk.isPending || stats.ready === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 px-5 shadow-sm cursor-pointer"
              >
                {updateBulk.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{locale === 'ta' ? 'புதுப்பிக்கப்படுகிறது...' : 'Updating Demographics...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {locale === 'ta'
                        ? `${stats.ready} வாக்குச்சாவடிகளை புதுப்பிக்கவும்`
                        : `Update ${stats.ready} Booth(s)`}
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function sourceFileNameDisplay(fileName: string | null, locale: string) {
  if (!fileName) return '';
  if (fileName === 'Pasted Data') {
    return locale === 'ta' ? 'ஒட்டப்பட்ட தரவு' : 'Pasted text data';
  }
  return fileName;
}

