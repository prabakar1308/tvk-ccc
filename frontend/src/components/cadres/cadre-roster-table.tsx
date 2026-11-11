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
import { printCadreRosterPdf, formatAadhaar, formatPhone } from '@/lib/cadre-print';
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
  divisionName?: string;
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

export function CadreRosterTable({
  cadres = [],
  title,
  unionName = '',
  unitName = '',
  unitType = '',
  districtName = '',
  divisionName = '',
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
  const formmatedDivisionName = divisionName;
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
    printCadreRosterPdf({
      cadres: listToPrint,
      locale,
      level: isUnion ? 'UNION' : 'KILAI',
      districtName,
      unionName,
      unitName,
      unitType,
      divisionName,
      panchayatName,
      kilaiName,
      boothDetails,
      maskAadhaar,
    });
  };

  const defaultTitle = locale === 'ta' ? 'நிர்வாகிகள் பட்டியல்' : 'Administrators Roster';
  const displayTitle = title || defaultTitle;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-7 shadow-sm border border-zinc-200/80 dark:border-zinc-800 space-y-5">
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
                const isSecretary = rawRole.toUpperCase().includes('SECRETARY') || rawRole.toUpperCase().includes('TREASURER');
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
