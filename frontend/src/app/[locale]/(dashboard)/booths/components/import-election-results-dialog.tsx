'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Trophy,
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
  Vote,
  X,
  RefreshCw,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import * as XLSX from 'xlsx';
import { Booth, BulkElectionResultItem } from '@/services/api/booths';
import { Election } from '@/services/api/elections';
import { useUpdateBoothElectionResultsBulk } from '@/hooks/use-booths';
import { ElectionSelect } from '@/components/shared/election-select';

export interface ParsedElectionResultRow {
  id: string;
  boothNo: string;
  dmkVotes: number;
  aiadmkVotes: number;
  tvkVotes: number;
  totalVotesPolled: number;
  tvkPercentage: number;
  winnerPartyName: 'TVK' | 'DMK' | 'AIADMK' | 'Tie' | string | null;
  margin: number | null;
  matchedBooth?: Booth;
  status: 'matched' | 'not_found' | 'invalid';
  warningMessage?: string;
}

export interface ImportElectionResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booths: Booth[];
  dbElections?: Election[];
  onSuccess?: () => void;
}

export function ImportElectionResultsDialog({
  open,
  onOpenChange,
  booths,
  dbElections = [],
  onSuccess,
}: ImportElectionResultsDialogProps) {
  const locale = useLocale();
  const updateBulk = useUpdateBoothElectionResultsBulk();

  // Find active election
  const activeMasterElection = useMemo(() => {
    return dbElections.find((e) => e.isCurrent) || dbElections[0] || null;
  }, [dbElections]);

  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [selectedElectionEntity, setSelectedElectionEntity] = useState<Election | null>(null);

  // Initialize election selection when dialog opens or active changes
  useEffect(() => {
    if (open) {
      if (!selectedElectionId && activeMasterElection) {
        setSelectedElectionId(activeMasterElection.id);
        setSelectedElectionEntity(activeMasterElection);
      }
    }
  }, [open, selectedElectionId, activeMasterElection]);

  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedElectionResultRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'ready' | 'issues'>('all');
  const [successResult, setSuccessResult] = useState<{
    updatedCount: number;
    notFound: string[];
    electionYear: string;
    electionName: string;
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
        'DMK votes': 420,
        'AIADMK votes': 380,
        'TVK votes': 490,
        'Total Votes': 1350,
      },
      {
        'Booth No': '2',
        'DMK votes': 510,
        'AIADMK votes': 460,
        'TVK votes': 410,
        'Total Votes': 1420,
      },
      {
        'Booth No': '3',
        'DMK votes': 340,
        'AIADMK votes': 390,
        'TVK votes': 380,
        'Total Votes': 1150,
      },
      {
        'Booth No': '4',
        'DMK votes': 290,
        'AIADMK votes': 270,
        'TVK votes': 450,
        'Total Votes': 1050,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TN_Election_Results');
    XLSX.writeFile(wb, 'Booth_Election_Results_Template.xlsx');
  };

  // Helper to process raw 2D array from Excel or TSV
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
        dmk: -1,
        aiadmk: -1,
        tvk: -1,
        total: -1,
      };

      for (let i = 0; i < Math.min(5, nonEmptyRows.length); i++) {
        const rowStr = nonEmptyRows[i]
          .map((c) => String(c ?? '').toLowerCase().trim())
          .join(' ');

        if (
          rowStr.includes('booth') ||
          rowStr.includes('dmk') ||
          rowStr.includes('aiadmk') ||
          rowStr.includes('admk') ||
          rowStr.includes('tvk') ||
          rowStr.includes('திமுக') ||
          rowStr.includes('அதிமுக') ||
          rowStr.includes('தவெக') ||
          rowStr.includes('வாக்குச்சாவடி')
        ) {
          headerIndex = i;
          nonEmptyRows[i].forEach((col: any, idx: number) => {
            const raw = String(col ?? '').trim().toLowerCase();
            const cleanAscii = raw.replace(/[^a-z0-9]/g, '');

            // 1. TVK (TVK / தவெக / த.வெ.க)
            if (
              raw.includes('tvk') ||
              raw.includes('தவெக') ||
              raw.includes('த.வெ.க') ||
              cleanAscii === 'tvk'
            ) {
              if (colMap.tvk === -1) colMap.tvk = idx;
            }
            // 2. AIADMK (AIADMK / ADMK / அதிமுக)
            else if (
              raw.includes('aiadmk') ||
              raw.includes('admk') ||
              raw.includes('அதிமுக') ||
              cleanAscii === 'aiadmk' ||
              cleanAscii === 'admk'
            ) {
              if (colMap.aiadmk === -1) colMap.aiadmk = idx;
            }
            // 3. DMK (DMK / திமுக)
            else if (
              raw.includes('dmk') ||
              raw.includes('திமுக') ||
              cleanAscii === 'dmk'
            ) {
              if (colMap.dmk === -1) colMap.dmk = idx;
            }
            // 4. Total Votes (Total / Polled / மொத்தம்)
            else if (
              raw.includes('total') ||
              raw.includes('tot') ||
              raw.includes('polled') ||
              raw.includes('மொத்தம்') ||
              raw.includes('பதிவான')
            ) {
              if (colMap.total === -1) colMap.total = idx;
            }
            // 5. Booth No
            else if (
              raw.includes('booth') ||
              raw.includes('station') ||
              raw.includes('வ.எண்') ||
              raw.includes('வஎண்') ||
              raw.includes('வாக்குச்சாவடி') ||
              cleanAscii === 'no' ||
              cleanAscii === 'bno' ||
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

      const hasCompleteHeader =
        headerIndex !== -1 &&
        colMap.dmk !== -1 &&
        colMap.aiadmk !== -1 &&
        colMap.tvk !== -1;

      const dataRows = headerIndex !== -1 ? nonEmptyRows.slice(headerIndex + 1) : nonEmptyRows;
      const rows: ParsedElectionResultRow[] = [];

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

        let dmk = 0;
        let aiadmk = 0;
        let tvk = 0;
        let total = 0;
        let parsedTotal: number | null = null;

        // If complete header is mapped and row has columns
        if (hasCompleteHeader) {
          dmk = Math.max(0, parseInt(cells[colMap.dmk] ?? '0', 10) || 0);
          aiadmk = Math.max(0, parseInt(cells[colMap.aiadmk] ?? '0', 10) || 0);
          tvk = Math.max(0, parseInt(cells[colMap.tvk] ?? '0', 10) || 0);

          if (colMap.total !== -1 && cells[colMap.total] !== undefined && cells[colMap.total] !== '') {
            const pt = parseInt(cells[colMap.total], 10);
            if (!isNaN(pt)) parsedTotal = pt;
          }

          const sumParties = dmk + aiadmk + tvk;
          total = parsedTotal !== null && !isNaN(parsedTotal) && parsedTotal > 0 ? parsedTotal : sumParties;
        } else {
          // Dynamic numeric column resolution: expecting [DMK, AIADMK, TVK, (Total)]
          const numCells: number[] = [];
          cells.forEach((cell, cellIdx) => {
            if (cellIdx !== colMap.boothNo) {
              const s = String(cell ?? '').trim();
              if (s !== '' && !isNaN(Number(s))) {
                numCells.push(Math.max(0, parseInt(s, 10) || 0));
              }
            }
          });

          if (numCells.length >= 4) {
            // Order: DMK, AIADMK, TVK, Total
            dmk = numCells[0];
            aiadmk = numCells[1];
            tvk = numCells[2];
            total = numCells[3];
            parsedTotal = numCells[3];
          } else if (numCells.length === 3) {
            // Order: DMK, AIADMK, TVK (Total is sum)
            dmk = numCells[0];
            aiadmk = numCells[1];
            tvk = numCells[2];
            total = dmk + aiadmk + tvk;
            parsedTotal = null;
          }
        }

        const sumCalculated = dmk + aiadmk + tvk;
        if (total === 0) total = sumCalculated;

        // Calculate TVK %
        const tvkPercentage =
          total > 0 ? Math.round((tvk / total) * 10000) / 100 : 0;

        // Calculate Winner and Margin
        const candidates = [
          { name: 'TVK', votes: tvk },
          { name: 'DMK', votes: dmk },
          { name: 'AIADMK', votes: aiadmk },
        ].sort((a, b) => b.votes - a.votes);

        let winnerPartyName: 'TVK' | 'DMK' | 'AIADMK' | 'Tie' | null = null;
        let margin: number | null = null;

        if (candidates[0].votes > 0) {
          if (candidates[0].votes === candidates[1]?.votes) {
            winnerPartyName = 'Tie';
            margin = 0;
          } else {
            winnerPartyName = candidates[0].name as any;
            margin = candidates[0].votes - (candidates[1]?.votes || 0);
          }
        }

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
        } else if (sumCalculated > total) {
          warningMessage =
            locale === 'ta'
              ? `கட்சிகளின் மொத்த வாக்குகள் (${sumCalculated}) மொத்த வாக்குகளை விட (${total}) அதிகம்`
              : `Sum of party votes (${sumCalculated}) exceeds total polled (${total})`;
        }

        rows.push({
          id: `election-row-${idx}-${cleanBoothNo}`,
          boothNo: cleanBoothNo,
          dmkVotes: dmk,
          aiadmkVotes: aiadmk,
          tvkVotes: tvk,
          totalVotesPolled: total,
          tvkPercentage,
          winnerPartyName,
          margin,
          matchedBooth: matched,
          status,
          warningMessage,
        });
      });

      if (rows.length === 0) {
        throw new Error(
          locale === 'ta'
            ? 'செல்லுபடியாகும் வாக்குச்சாவடி தேர்தல் முடிவுகள் எதுவும் கண்டறியப்படவில்லை.'
            : 'No valid booth election result records could be extracted.'
        );
      }

      setParsedRows(rows);
      setFileName(sourceName);
    } catch (err: any) {
      console.error('Error parsing election results:', err);
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
      const parts = line.split(/\s+/);
      if (parts.length >= 4 && parts.slice(1).every((p) => !isNaN(Number(p)))) {
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

    const matchedRows = parsedRows.filter((r) => r.status === 'matched');
    const totalTvkVotes = matchedRows.reduce((sum, r) => sum + r.tvkVotes, 0);
    const totalPolledVotes = matchedRows.reduce((sum, r) => sum + r.totalVotesPolled, 0);
    const avgTvkPct =
      totalPolledVotes > 0
        ? Math.round((totalTvkVotes / totalPolledVotes) * 10000) / 100
        : 0;

    const tvkWins = matchedRows.filter((r) => r.winnerPartyName === 'TVK').length;
    const dmkWins = matchedRows.filter((r) => r.winnerPartyName === 'DMK').length;
    const aiadmkWins = matchedRows.filter((r) => r.winnerPartyName === 'AIADMK').length;

    return {
      total,
      ready,
      issues,
      totalTvkVotes,
      totalPolledVotes,
      avgTvkPct,
      tvkWins,
      dmkWins,
      aiadmkWins,
    };
  }, [parsedRows]);

  // Filtered rows for preview table
  const displayedRows = useMemo(() => {
    if (filterTab === 'ready') return parsedRows.filter((r) => r.status === 'matched');
    if (filterTab === 'issues') return parsedRows.filter((r) => r.status !== 'matched');
    return parsedRows;
  }, [parsedRows, filterTab]);

  // Apply batch update
  const handleApplyUpdate = async () => {
    if (!selectedElectionEntity) {
      alert(
        locale === 'ta'
          ? 'தயவுசெய்து ஒரு தேர்தலை தேர்ந்தெடுக்கவும்.'
          : 'Please select an election first.'
      );
      return;
    }

    const matchedItems: BulkElectionResultItem[] = parsedRows
      .filter((r) => r.status === 'matched')
      .map((r) => ({
        boothNo: r.boothNo,
        dmkVotes: r.dmkVotes,
        aiadmkVotes: r.aiadmkVotes,
        tvkVotes: r.tvkVotes,
        totalVotesPolled: r.totalVotesPolled,
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
      const electionName =
        locale === 'ta' && selectedElectionEntity.nameTa
          ? selectedElectionEntity.nameTa
          : selectedElectionEntity.name;

      const res = await updateBulk.mutateAsync({
        electionId: selectedElectionEntity.id,
        electionYear: selectedElectionEntity.year,
        electionName,
        results: matchedItems,
      });

      setSuccessResult({
        updatedCount: res.updatedCount,
        notFound: res.notFound || [],
        electionYear: selectedElectionEntity.year,
        electionName,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Failed to update election results:', err);
      alert(err.message || 'Failed to update election results');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[880px] w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden !p-6 sm:!p-7 rounded-2xl shadow-2xl border border-primary/20 bg-background space-y-5">
        <DialogHeader className="space-y-3 pb-3 border-b border-primary/10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                  {locale === 'ta'
                    ? 'தமிழ்நாடு தேர்தல் முடிவுகள் இறக்குமதி / நகல்-ஒட்டு'
                    : 'Import / Paste TN Election Results'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === 'ta'
                    ? 'வாக்குச்சாவடி எண், திமுக, அதிமுக, தவெக மற்றும் மொத்த வாக்குகள் தகவலை ஒரே நேரத்தில் புதுப்பிக்கவும்.'
                    : 'Update DMK, AIADMK, TVK, and Total votes in bulk per booth using Excel or Copy-Paste.'}
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
                  ? 'தேர்தல் முடிவுகள் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!'
                  : 'Election Results Successfully Updated!'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {locale === 'ta'
                  ? `${successResult.electionName} (${successResult.electionYear}) - ${successResult.updatedCount} வாக்குச்சாவடிகளுக்கான வாக்கு முடிவுகள் புதுப்பிக்கப்பட்டுள்ளது.`
                  : `Successfully updated election results for ${successResult.updatedCount} booths in ${successResult.electionName} (${successResult.electionYear}).`}
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
            {/* Election Selection Section */}
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 flex flex-col sm:flex-row sm:items-center justify-start gap-3">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Vote className="w-3.5 h-3.5 text-primary" />
                  <span>{locale === 'ta' ? 'இலக்கு தேர்தல்' : 'Target Election'} *</span>
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  {locale === 'ta'
                    ? 'முடிவுகளை பதிவு செய்ய விரும்பும் தேர்தலை தேர்ந்தெடுக்கவும்.'
                    : 'Select the election you are updating results for.'}
                </p>
              </div>

              <div className="w-full sm:w-72">
                <ElectionSelect
                  value={selectedElectionId}
                  elections={dbElections}
                  autoSelectActive
                  showActiveBadge
                  onSelectElection={(elec) => {
                    if (elec) {
                      setSelectedElectionId(elec.id);
                      setSelectedElectionEntity(elec);
                    }
                  }}
                  className="bg-background shadow-xs h-9 text-xs font-medium"
                />
              </div>
            </div>

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
                    Booth No [tab] DMK [tab] AIADMK [tab] TVK [tab] Total
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    rows={5}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    onPaste={handleTextareaPaste}
                    placeholder={`Booth No\tDMK votes\tAIADMK votes\tTVK votes\tTotal Votes\n1\t420\t380\t490\t1350\n2\t510\t460\t410\t1420\n3\t340\t390\t380\t1150`}
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
                      ? 'வரிசை: வாக்குச்சாவடி எண், திமுக, அதிமுக, தவெக, மொத்த வாக்குகள்'
                      : 'Order: Booth No, DMK votes, AIADMK votes, TVK votes, Total Votes'}
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
                    id="election-results-excel-file-input"
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
                        .xlsx, .xls, .csv &bull; Columns: Booth No, DMK votes, AIADMK votes, TVK votes, Total Votes
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
              <div className="space-y-3.5 pt-2">
                {/* 1. Validation & Data Matching Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="flex items-center gap-2 text-xs">
                    <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">
                      {sourceFileNameDisplay(fileName, locale)}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      ({stats.total} {locale === 'ta' ? 'வரிகள்' : 'rows parsed'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    {/* Total Extracted */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border text-foreground font-medium">
                      <span className="text-muted-foreground">{locale === 'ta' ? 'மொத்தம்:' : 'Total:'}</span>
                      <span className="font-mono font-bold">{stats.total}</span>
                    </div>

                    {/* Matched in System */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{locale === 'ta' ? 'பொருந்தியவை:' : 'Matched:'}</span>
                      <span className="font-mono font-black">{stats.ready}</span>
                    </div>

                    {/* Not in System */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold border ${
                      stats.issues > 0
                        ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30'
                        : 'bg-background text-muted-foreground border-border'
                    }`}>
                      {stats.issues > 0 ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      )}
                      <span>{locale === 'ta' ? 'கணினியில் இல்லை:' : 'Not in System:'}</span>
                      <span className="font-mono font-black">{stats.issues}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Election Analytics Cards (TVK Performance & Party Wins Breakdown) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* TVK Performance Card (5 cols) */}
                  <div className="md:col-span-5 p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 via-primary/5 to-transparent border border-primary/20 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center text-[10px] font-black">
                          TVK
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          {locale === 'ta' ? 'தவெக வாக்குகள்' : 'TVK Votes & Share'}
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                        {stats.avgTvkPct}%
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-mono text-primary">
                          {stats.totalTvkVotes.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {locale === 'ta' ? 'வாக்குகள்' : 'votes'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {locale === 'ta'
                          ? `மொத்த ${stats.totalPolledVotes.toLocaleString()} வாக்குகளில்`
                          : `out of ${stats.totalPolledVotes.toLocaleString()} total polled votes`}
                      </p>
                    </div>
                  </div>

                  {/* Party Wins Breakdown (7 cols) */}
                  <div className="md:col-span-7 p-3.5 rounded-xl bg-card border border-border flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-border/60">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        {locale === 'ta' ? 'வாக்குச்சாவடி வெற்றி நிலவரம்' : 'Booth Wins Breakdown'}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono font-medium">
                        {stats.ready} {locale === 'ta' ? 'சாவடிகள்' : 'booths'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* TVK Wins */}
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase">
                          TVK
                        </span>
                        <span className="text-base font-black font-mono text-amber-700 dark:text-amber-300 mt-0.5">
                          {stats.tvkWins}
                        </span>
                        <span className="text-[9px] text-amber-600/80 font-medium">
                          {stats.ready > 0 ? Math.round((stats.tvkWins / stats.ready) * 100) : 0}% wins
                        </span>
                      </div>

                      {/* DMK Wins */}
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/25 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black text-red-700 dark:text-red-300 uppercase">
                          DMK
                        </span>
                        <span className="text-base font-black font-mono text-red-700 dark:text-red-300 mt-0.5">
                          {stats.dmkWins}
                        </span>
                        <span className="text-[9px] text-red-600/80 font-medium">
                          {stats.ready > 0 ? Math.round((stats.dmkWins / stats.ready) * 100) : 0}% wins
                        </span>
                      </div>

                      {/* AIADMK Wins */}
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase">
                          AIADMK
                        </span>
                        <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                          {stats.aiadmkWins}
                        </span>
                        <span className="text-[9px] text-emerald-600/80 font-medium">
                          {stats.ready > 0 ? Math.round((stats.aiadmkWins / stats.ready) * 100) : 0}% wins
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter Tabs & Clear All */}
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

                {/* Preview Table - Clean, Proportional, No internal scrollbar, No horizontal scrollbar */}
                <div className="border border-border/80 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left divide-y divide-border table-fixed">
                    <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] font-bold sticky top-0 backdrop-blur-xs z-10">
                      <tr>
                        <th className="py-2.5 px-2 text-center w-8">#</th>
                        <th className="py-2.5 px-2 w-16">Booth</th>
                        <th className="py-2.5 px-2">Booth Name</th>
                        <th className="py-2.5 px-2 text-right text-red-600 dark:text-red-400 w-14">DMK</th>
                        <th className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400 w-16">AIADMK</th>
                        <th className="py-2.5 px-2 text-right text-primary font-bold w-14">TVK</th>
                        <th className="py-2.5 px-2 text-right w-16">Total</th>
                        <th className="py-2.5 px-2 text-center w-24">Winner</th>
                        <th className="py-2.5 px-2 text-right w-14">TVK %</th>
                        <th className="py-2.5 px-2 text-center w-16">Status</th>
                        <th className="py-2.5 px-1.5 text-center w-8"></th>
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
                            <td className="py-2 px-2 text-center text-muted-foreground font-sans text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2 font-bold text-foreground truncate">
                              #{row.boothNo}
                            </td>
                            <td className="py-2 px-2 font-sans truncate">
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
                            <td className="py-2 px-2 text-right text-foreground">
                              {row.dmkVotes}
                            </td>
                            <td className="py-2 px-2 text-right text-foreground">
                              {row.aiadmkVotes}
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-primary">
                              {row.tvkVotes}
                            </td>
                            <td className="py-2 px-2 text-right text-foreground">
                              {row.totalVotesPolled}
                            </td>
                            <td className="py-2 px-2 text-center font-sans">
                              {row.winnerPartyName ? (
                                <WinnerBadge
                                  winner={row.winnerPartyName}
                                  margin={row.margin}
                                />
                              ) : (
                                <span className="text-muted-foreground text-[10px]">-</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-foreground">
                              {row.tvkPercentage}%
                            </td>
                            <td className="py-2 px-2 text-center font-sans">
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
                            <td className="py-2 px-1.5 text-center">
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
                disabled={updateBulk.isPending || stats.ready === 0 || !selectedElectionEntity}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-2 px-5 shadow-sm cursor-pointer"
              >
                {updateBulk.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{locale === 'ta' ? 'புதுப்பிக்கப்படுகிறது...' : 'Updating Results...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {locale === 'ta'
                        ? `${stats.ready} வாக்குச்சாவடி முடிவுகளை புதுப்பிக்கவும்`
                        : `Update ${stats.ready} Booth Result(s)`}
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

function WinnerBadge({ winner, margin }: { winner: string; margin: number | null }) {
  if (winner === 'TVK') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">
        <span>TVK</span>
        {margin !== null && margin > 0 && <span className="opacity-80">+{margin}</span>}
      </span>
    );
  }
  if (winner === 'DMK') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 whitespace-nowrap">
        <span>DMK</span>
        {margin !== null && margin > 0 && <span className="opacity-80">+{margin}</span>}
      </span>
    );
  }
  if (winner === 'AIADMK') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
        <span>ADMK</span>
        {margin !== null && margin > 0 && <span className="opacity-80">+{margin}</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
      {winner}
    </span>
  );
}

function sourceFileNameDisplay(fileName: string | null, locale: string) {
  if (!fileName) return '';
  if (fileName === 'Pasted Data') {
    return locale === 'ta' ? 'ஒட்டப்பட்ட தரவு' : 'Pasted text data';
  }
  return fileName;
}

