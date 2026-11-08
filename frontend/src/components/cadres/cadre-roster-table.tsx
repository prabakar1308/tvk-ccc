'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Printer, 
  Search, 
  LayoutGrid, 
  List, 
  Phone, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2, 
  CreditCard, 
  ShieldCheck, 
  UserCheck, 
  Users,
  Building2
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { CadreCard } from '@/components/cadre-card';
import { formatDesignation } from '@/components/cadre-card';
import { translatePersonNameToTamil } from '@/lib/name-translations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface CadreRosterTableProps {
  cadres: any[];
  title?: string;
  unionName?: string;
  unitName?: string;
  unitType?: string;
  districtName?: string;
  panchayatName?: string;
  kilaiName?: string;
  boothDetails?: string;
  subtitle?: string;
  defaultView?: 'table' | 'cards';
  showActions?: boolean;
  onView?: (cadre: any) => void;
  onEdit?: (e: React.MouseEvent, cadre: any) => void;
  onDelete?: (e: React.MouseEvent, id: string) => void;
  onCall?: (person: { name: string; phone: string }, e: React.MouseEvent) => void;
}

/**
 * Format 12-digit Aadhaar into `XXXX XXXX 1234` or `1234 5678 9012`
 */
function formatAadhaar(raw?: string, masked: boolean = false): string {
  if (!raw) return '-';
  const clean = String(raw).replace(/\D/g, '');
  if (clean.length !== 12) return raw;

  if (masked) {
    return `•••• •••• ${clean.slice(8)}`;
  }
  return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8)}`;
}

/**
 * Format phone number into clean readable format
 */
function formatPhone(raw?: string): string {
  if (!raw) return '-';
  const clean = String(raw).replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return raw;
}

export function CadreRosterTable({
  cadres = [],
  title,
  unionName = '',
  unitName = '',
  unitType = '',
  districtName = '',
  panchayatName = '',
  kilaiName = '',
  boothDetails = '',
  subtitle,
  defaultView = 'table',
  showActions = true,
  onView,
  onEdit,
  onDelete,
  onCall,
}: CadreRosterTableProps) {
  const locale = useLocale();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(defaultView);
  const [isDesktop, setIsDesktop] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [maskAadhaar, setMaskAadhaar] = useState(false);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  // Responsive check: Table view only for desktop (>= 1024px); Tile view for others
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveViewMode = isDesktop ? viewMode : 'cards';

  // Determine if viewing a Union (not a Kilai)
  const isUnion = !kilaiName;

  // Resolved Org Unit & Union Name: Union Name in bracket [ Org Unit Type ]
  const effectiveUnionName = unionName || unitName || (locale === 'ta' ? 'ஒன்றியம்' : 'Union');
  const formattedOrgUnit = unitType ? `${effectiveUnionName} [ ${unitType} ]` : effectiveUnionName;

  // Filter cadres based on search query
  const filteredCadres = useMemo(() => {
    if (!cadres || cadres.length === 0) return [];
    if (!searchQuery.trim()) return cadres;

    const q = searchQuery.toLowerCase().trim();
    return cadres.filter((cadre) => {
      const name = cadre.name?.toLowerCase() || '';
      const nameTa = (cadre.nameTa || translatePersonNameToTamil(cadre.name || '')).toLowerCase();
      const phone = String(cadre.phone || '').toLowerCase();
      const aadhaar = String(cadre.aadhaarNumber || '').toLowerCase();
      const voterId = String(cadre.voterId || '').toLowerCase();
      const memberId = String(cadre.memberId || '').toLowerCase();
      const boothNo = String(cadre.boothNo || '').toLowerCase();
      const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || '';
      const roleText = formatDesignation(rawRole, locale).toLowerCase();

      return (
        name.includes(q) ||
        nameTa.includes(q) ||
        phone.includes(q) ||
        aadhaar.includes(q) ||
        voterId.includes(q) ||
        memberId.includes(q) ||
        boothNo.includes(q) ||
        roleText.includes(q)
      );
    });
  }, [cadres, searchQuery, locale]);

  /**
   * Generates a high-quality printable document with official TVK branding,
   * full Tamil Unicode support, and triggers browser print (Save as PDF).
   */
  const handlePrintPdf = () => {
    const listToPrint = filteredCadres.length > 0 ? filteredCadres : cadres;
    const now = new Date();
    const formattedDate = now.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // District Name included in doc title
    const baseTitle = locale === 'ta' 
      ? 'நிர்வாகிகள் பட்டியல்' 
      : 'Administrators Roster';
    const districtSuffix = districtName 
      ? ` - ${districtName} ${locale === 'ta' ? 'மாவட்டம்' : 'District'}` 
      : '';
    const fullDocTitle = `${baseTitle}${districtSuffix}`;

    const partyNameTa = 'தமிழக வெற்றிக் கழகம்';
    const partyNameEn = 'TAMIZHAGA VETRI KAZHAGAM';

    // Build Table Rows HTML
    // If Union: includes Booth No column; if Kilai: no Booth No column
    const tableRowsHtml = listToPrint.map((c, idx) => {
      const primaryName = locale === 'ta' ? (c.nameTa || translatePersonNameToTamil(c.name)) : c.name;
      const secondaryName = locale === 'ta' ? c.name : (c.nameTa || translatePersonNameToTamil(c.name));
      const rawRole = c.officeBearerRoles?.[0]?.role || c.role || 'Member';
      const role = formatDesignation(rawRole, locale);
      const phone = formatPhone(c.phone);
      const aadhaar = formatAadhaar(c.aadhaarNumber, maskAadhaar);
      const voterId = c.voterId ? String(c.voterId).toUpperCase() : '';
      const memberId = c.memberId ? String(c.memberId) : '';

      return `
        <tr>
          <td style="text-align: center; font-weight: bold; width: 34px;">${idx + 1}</td>
          <td>
            <div style="font-weight: 700; font-size: 12.5px; color: #111827;">${primaryName}</div>
            ${secondaryName && secondaryName !== primaryName ? `<div style="font-size: 10.5px; color: #6B7280; margin-top: 1px;">${secondaryName}</div>` : ''}
          </td>
          <td>
            <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5;">
              ${role}
            </span>
          </td>
          ${isUnion ? `
          <td style="font-family: monospace; font-size: 11.5px; font-weight: 700; color: #1F2937;">
            ${c.boothNo ? `#${c.boothNo}` : '-'}
          </td>
          ` : ''}
          <td style="font-family: monospace; font-size: 11.5px; font-weight: 600; color: #1F2937;">${phone}</td>
          <td style="font-family: monospace; font-size: 11.5px; font-weight: 600; color: #1F2937;">${aadhaar}</td>
          <td>
            ${(voterId || memberId) ? `<div style="font-family: monospace; font-size: 11.5px; font-weight: 700; color: #1F2937;">${voterId || memberId}</div>` : ''}
            ${!voterId && !memberId ? '-' : ''}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${fullDocTitle} - ${effectiveUnionName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 12mm 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Mukta Malar', 'Noto Sans Tamil', sans-serif;
            color: #111827;
            background: #fff;
            margin: 0;
            padding: 10px;
            font-size: 11.5px;
            line-height: 1.35;
          }
          .header-stripe {
            height: 6px;
            background: linear-gradient(90deg, #8F0A1B 0%, #D97706 50%, #FFC72C 100%);
            border-radius: 4px;
            margin-bottom: 10px;
          }
          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #8F0A1B;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .party-title-ta {
            font-size: 18px;
            font-weight: 900;
            color: #8F0A1B;
            letter-spacing: 0.5px;
          }
          .party-title-en {
            font-size: 10.5px;
            font-weight: 800;
            color: #4B5563;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-top: 1px;
          }
          .doc-badge {
            text-align: right;
          }
          .doc-badge h2 {
            margin: 0;
            font-size: 14.5px;
            font-weight: 900;
            color: #1F2937;
          }
          .doc-badge p {
            margin: 2px 0 0 0;
            font-size: 9.5px;
            color: #6B7280;
            font-weight: 600;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px 14px;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 12px;
            font-size: 11px;
            align-items: start;
          }
          .meta-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }
          .meta-item strong {
            color: #6B7280;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .meta-item span {
            color: #111827;
            font-weight: 700;
            font-size: 11.5px;
            word-break: break-word;
            line-height: 1.35;
          }
          .meta-item.col-span-2 {
            grid-column: span 2;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
          }
          th {
            background-color: #8F0A1B !important;
            color: #ffffff !important;
            font-weight: 700;
            font-size: 10.5px;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #750816;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }
          td {
            padding: 6px 8px;
            border: 1px solid #E5E7EB;
            vertical-align: middle;
            font-size: 11px;
          }
          tr:nth-child(even) td {
            background-color: #F9FAFB !important;
          }
          .sign-section {
            margin-top: 32px;
            display: flex;
            justify-content: space-between;
            padding: 0 30px;
            page-break-inside: avoid;
          }
          .sign-box {
            text-align: center;
            border-top: 1px dashed #6B7280;
            width: 180px;
            padding-top: 6px;
            font-size: 10.5px;
            font-weight: 700;
            color: #374151;
          }
          .footer-note {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #9CA3AF;
            border-top: 1px solid #E5E7EB;
            padding-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="header-stripe"></div>
        <div class="header-box">
          <div>
            <div class="party-title-ta">${partyNameTa}</div>
            <div class="party-title-en">${partyNameEn}</div>
          </div>
          <div class="doc-badge">
            <h2>${fullDocTitle}</h2>
            <p>${formattedOrgUnit} ${kilaiName ? `• ${kilaiName}` : ''} • ${formattedDate}</p>
          </div>
        </div>

        <div class="meta-grid">
          <!-- Org Unit: Union name in bracket [ Org Unit Type ] -->
          <div class="meta-item">
            <strong>${locale === 'ta' ? 'அமைப்பு அலகு:' : 'Org Unit:'}</strong>
            <span>${formattedOrgUnit}</span>
          </div>

          <!-- Panchayat (District removed and replaced with Panchayat) -->
          <div class="meta-item">
            <strong>${locale === 'ta' ? 'ஊராட்சி:' : 'Panchayat:'}</strong>
            <span>${panchayatName || '-'}</span>
          </div>

          ${kilaiName ? `
          <!-- If Kilai: Kilai Name on Row 1 (Col 3) -->
          <div class="meta-item">
            <strong>${locale === 'ta' ? 'கிளை:' : 'Kilai:'}</strong>
            <span>${kilaiName}</span>
          </div>

          <!-- If Kilai: Booth Details spans 2 cols on Row 2 -->
          <div class="meta-item col-span-2">
            <strong>${locale === 'ta' ? 'சாவடி விவரம்:' : 'Booth Details:'}</strong>
            <span>${boothDetails || '-'}</span>
          </div>

          <!-- If Kilai: Total Administrators occupies Col 3 on Row 2 -->
          <div class="meta-item">
            <strong>${locale === 'ta' ? 'மொத்த நிர்வாகிகள்:' : 'Total Administrators:'}</strong>
            <span>${listToPrint.length}</span>
          </div>
          ` : `
          <!-- If Union: Total Administrators on Row 1 (Col 3). NO Booth Details in header! -->
          <div class="meta-item">
            <strong>${locale === 'ta' ? 'மொத்த நிர்வாகிகள்:' : 'Total Administrators:'}</strong>
            <span>${listToPrint.length}</span>
          </div>
          `}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 34px; text-align: center;">#</th>
              <th>${locale === 'ta' ? 'பெயர் / Name' : 'Name'}</th>
              <th>${locale === 'ta' ? 'பொறுப்பு / Role' : 'Role'}</th>
              ${isUnion ? `<th>${locale === 'ta' ? 'சாவடி எண் / Booth No' : 'Booth No'}</th>` : ''}
              <th>${locale === 'ta' ? 'கைபேசி எண் / Phone' : 'Phone No'}</th>
              <th>${locale === 'ta' ? 'ஆதார் எண் / Aadhaar' : 'Aadhaar No'}</th>
              <th>${locale === 'ta' ? 'வாக்காளர் எண்' : 'Voter ID'}</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="sign-section">
          <div class="sign-box">
            ${locale === 'ta' ? 'செயலாளர் கையொப்பம்' : 'Secretary Signature'}
          </div>
          <div class="sign-box">
            ${locale === 'ta' ? 'தலைவர் கையொப்பம்' : 'Chief Secretary Signature'}
          </div>
        </div>

        <div class="footer-note">
          ${locale === 'ta' ? 'தமிழக வெற்றிக் கழகம் தலைமை கட்டளை மையம் மூலம் அச்சிடப்பட்டது' : 'Generated by TVK Command Centre Official Platform'} • ${formattedDate} ${formattedTime}
        </div>
      </body>
      </html>
    `;

    // Use hidden iframe to print cleanly without popup blockers
    let printFrame = printFrameRef.current;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      setTimeout(() => {
        printFrame?.contentWindow?.focus();
        printFrame?.contentWindow?.print();
      }, 350);
    } else {
      // Fallback to popup window
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(htmlContent);
        win.document.close();
        setTimeout(() => {
          win.focus();
          win.print();
        }, 350);
      }
    }
  };

  const defaultTitle = locale === 'ta' ? 'நிர்வாகிகள் பட்டியல்' : 'Administrators Roster';
  const displayTitle = title || defaultTitle;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-7 shadow-sm border border-zinc-200/80 dark:border-zinc-800 space-y-5">
      {/* Hidden iframe for reliable PDF print trigger */}
      <iframe ref={printFrameRef} className="hidden" title="print-frame" />

      {/* Header with Title, Search, View Switcher & PDF Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-amber-500/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {displayTitle}
              </h2>
              <span className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-red-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-primary/20 shadow-2xs">
                {filteredCadres.length}
                {searchQuery.trim() && filteredCadres.length !== cadres.length && (
                  <span className="opacity-60 ml-1">/ {cadres.length}</span>
                )}
              </span>
            </div>
            {/* Subtitle: Only Org Unit, Panchayat and Kilai on the web page (No booth details below title) */}
            {/* <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
              {subtitle ? (
                <span>{subtitle}</span>
              ) : (
                <>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formattedOrgUnit}</span>
                  {panchayatName && panchayatName !== '-' && (
                    <span>• {locale === 'ta' ? 'ஊராட்சி' : 'Panchayat'}: {panchayatName}</span>
                  )}
                  {kilaiName && (
                    <span>• {locale === 'ta' ? 'கிளை' : 'Kilai'}: {kilaiName}</span>
                  )}
                </>
              )}
            </p> */}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Live Search */}
          <div className="relative flex-1 sm:w-56 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'ta' ? 'பெயர், சாவடி, பொறுப்பு, எண்...' : 'Search name, booth, role, phone, ID...'}
              className="h-9 text-xs pl-9 pr-3 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/60 focus-visible:ring-primary/20"
            />
          </div>

          {/* Aadhaar Masking Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMaskAadhaar(!maskAadhaar)}
            className="h-9 text-xs px-2.5 rounded-xl border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 bg-zinc-50/50 dark:bg-zinc-800/50 shrink-0"
            title={maskAadhaar ? (locale === 'ta' ? 'முழு ஆதாரை காட்டு' : 'Show full Aadhaar') : (locale === 'ta' ? 'ஆதாரை மறை' : 'Mask Aadhaar')}
          >
            {maskAadhaar ? <Eye className="w-3.5 h-3.5 mr-1.5" /> : <EyeOff className="w-3.5 h-3.5 mr-1.5" />}
            <span className="hidden sm:inline">{maskAadhaar ? 'Show' : 'Mask'}</span>
          </Button>

          {/* PDF / Print Generator Button */}
          <Button
            type="button"
            onClick={handlePrintPdf}
            disabled={cadres.length === 0}
            className="h-9 px-3.5 rounded-xl text-xs font-bold bg-[#8F0A1B] hover:bg-[#8F0A1B]/90 text-white shadow-xs transition-transform active:scale-95 shrink-0"
            title={locale === 'ta' ? 'பட்டியலை PDF ஆக அச்சிடு' : 'Print / Save as PDF'}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            <span>{locale === 'ta' ? 'PDF அச்சிடு' : 'Print PDF'}</span>
          </Button>

          {/* View Mode Toggle: Desktop only (Table view is only applicable for desktop) */}
          <div className="hidden lg:flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 border border-zinc-200 dark:border-zinc-700 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title={locale === 'ta' ? 'அட்டவணை பார்வை' : 'Table View'}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title={locale === 'ta' ? 'கார்டுகள் பார்வை' : 'Tile View'}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredCadres.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {searchQuery.trim()
              ? (locale === 'ta' ? 'தேடலுக்கு பொருத்தமான நிர்வாகிகள் எதுவும் கிடைக்கவில்லை.' : 'No matching administrators found.')
              : (locale === 'ta' ? 'இந்த பிரிவில் இதுவரை நிர்வாகிகள் பதிவு செய்யப்படவில்லை.' : 'No administrators registered yet.')}
          </p>
          {searchQuery.trim() && (
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'ta' ? 'வேறு தேடல் சொல்லை முயற்சிக்கவும்' : 'Try searching with a different name, role or ID number'}
            </p>
          )}
        </div>
      ) : effectiveViewMode === 'table' ? (
        /* TABLE VIEW (Columns: #, Name, Role, [Booth No if Union], Phone No, Aadhaar No, Voter ID / Member ID, Actions) */
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider py-3.5">
                  #
                </TableHead>
                <TableHead className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider py-3.5">
                  {locale === 'ta' ? 'நிர்வாகி பெயர்' : 'Name'}
                </TableHead>
                <TableHead className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider py-3.5">
                  {locale === 'ta' ? 'பொறுப்பு' : 'Role'}
                </TableHead>
                {/* Booth No Column: Only for Union org unit, NOT for Kilai */}
                {isUnion && (
                  <TableHead className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider py-3.5">
                    {locale === 'ta' ? 'சாவடி எண்' : 'Booth No'}
                  </TableHead>
                )}
                <TableHead className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider py-3.5">
                  {locale === 'ta' ? 'கைபேசி எண்' : 'Phone No'}
                </TableHead>
                <TableHead className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider py-3.5">
                  {locale === 'ta' ? 'ஆதார் எண்' : 'Aadhaar No'}
                </TableHead>
                <TableHead className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider py-3.5">
                  {locale === 'ta' ? 'வாக்காளர்' : 'Voter ID'}
                </TableHead>
                {showActions && (
                  <TableHead className="w-24 text-right text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider py-3.5 pr-4">
                    {locale === 'ta' ? 'செயல்கள்' : 'Actions'}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredCadres.map((cadre: any, idx: number) => {
                const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || 'Member';
                const isSecretary = rawRole.toUpperCase().includes('SECRETARY');
                const isPresident = rawRole.toUpperCase().includes('PRESIDENT');
                const roleDesignation = formatDesignation(rawRole, locale);

                const primaryName = locale === 'ta' 
                  ? (cadre.nameTa || translatePersonNameToTamil(cadre.name)) 
                  : cadre.name;
                const secondaryName = locale === 'ta' 
                  ? cadre.name 
                  : (cadre.nameTa || translatePersonNameToTamil(cadre.name));

                return (
                  <TableRow 
                    key={cadre.id || idx}
                    onClick={() => onView && onView(cadre)}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                  >
                    {/* S.No */}
                    <TableCell className="text-center font-bold text-xs text-zinc-400 group-hover:text-primary transition-colors py-3.5">
                      {idx + 1}
                    </TableCell>

                    {/* Name Column - No Member ID below name */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar 
                          name={cadre.name} 
                          src={cadre.photoUrl} 
                          size="sm"
                          shape="rounded"
                          className="w-9 h-9 border border-zinc-200 dark:border-zinc-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0" 
                        />
                        <div className="min-w-0">
                          <p className="font-heading font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors truncate">
                            {primaryName}
                          </p>
                          {secondaryName && secondaryName !== primaryName && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {secondaryName}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Role Column */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border shadow-2xs ${
                            isSecretary 
                              ? 'bg-red-50 text-[#8F0A1B] dark:bg-red-950/40 dark:text-red-300 border-red-200/80 dark:border-red-900/40' 
                              : isPresident 
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/40' 
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700/80'
                          }`}
                        >
                          {isSecretary ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#8F0A1B] dark:text-red-400" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                          <span>{roleDesignation}</span>
                        </span>
                      </div>
                    </TableCell>

                    {/* Booth No Column: Only for Union org unit, NOT for Kilai */}
                    {isUnion && (
                      <TableCell className="py-3.5">
                        {cadre.boothNo ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 px-2 py-0.5 rounded-md">
                            #{cadre.boothNo}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}

                    {/* Phone No Column */}
                    <TableCell className="py-3.5">
                      {cadre.phone ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onCall) {
                              onCall({ name: cadre.name, phone: cadre.phone }, e);
                            } else {
                              window.location.href = `tel:${cadre.phone}`;
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs transition-all active:scale-95 group/btn"
                        >
                          <Phone className="w-3 h-3 group-hover/btn:animate-bounce" />
                          <span className="font-mono">{formatPhone(cadre.phone)}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Aadhaar No Column */}
                    <TableCell className="py-3.5">
                      {cadre.aadhaarNumber ? (
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100/70 dark:bg-zinc-800/70 px-2.5 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
                          <CreditCard className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span>{formatAadhaar(cadre.aadhaarNumber, maskAadhaar)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Voter ID & Member ID Column */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {cadre.voterId || cadre.memberId ? (
                          <span className="inline-flex items-center w-max px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 uppercase">
                            {cadre.voterId || cadre.memberId}
                          </span>
                        ) : null}
                        {!cadre.voterId && !cadre.memberId && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions Column */}
                    {showActions && (
                      <TableCell className="py-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {onView && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onView(cadre)}
                              className="h-8 w-8 text-zinc-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                              title={locale === 'ta' ? 'விவரங்களை காண்க' : 'View Details'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => onEdit(e, cadre)}
                              className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                              title={locale === 'ta' ? 'திருத்து' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => onDelete(e, cadre.id)}
                              className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                              title={locale === 'ta' ? 'நீக்கு' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid gap-5 sm:gap-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {filteredCadres.map((cadre: any, index: number) => {
            const rawRole = cadre.officeBearerRoles?.[0]?.role || cadre.role || 'Member';
            const isSecretary = rawRole.toUpperCase().includes('SECRETARY') || rawRole.toUpperCase().includes('PRESIDENT');
            const highlight = index === 0 && isSecretary;

            return (
              <CadreCard
                key={cadre.id || index}
                cadre={cadre}
                highlight={highlight}
                minWidth="240px"
                showLocation={true}
                onView={(c) => onView && onView(c)}
                onEdit={(e, c) => onEdit && onEdit(e, c)}
                onDelete={(e, id) => onDelete && onDelete(e, id)}
                onCall={(person, e) => onCall && onCall(person, e)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
