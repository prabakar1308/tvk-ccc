'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import {
  useBooths,
  useCreateBooth,
  useUpdateBooth,
  useDeleteBooth,
  useAddBoothElectionResult,
  useUpdateBoothElectionResult,
  useDeleteBoothElectionResult,
  useAssignBoothElectionAgents,
  useUpdateBoothElectionAgent,
  useRemoveBoothElectionAgent,
} from '@/hooks/use-booths';
import { useElections, useCurrentElection } from '@/hooks/use-elections';
import { useUnions } from '@/hooks/use-unions';
import { usePanchayats } from '@/hooks/use-panchayats';
import { useVillages } from '@/hooks/use-villages';
import { useKilais } from '@/hooks/use-kilais';
import { shortenBoothName } from '@/lib/booth-utils';
import {
  BoothElectionResult,
  CreateBoothElectionResultDto,
} from '@/services/api/booths';
import { CallConfirmationDialog } from '@/components/shared/call-confirmation-dialog';

// Feature Components
import { BoothsMetrics } from './components/booths-metrics';
import { BoothsFilters } from './components/booths-filters';
import { BoothsTableView } from './components/booths-table-view';
import { BoothsGridView } from './components/booths-grid-view';
import { BoothsPagination } from './components/booths-pagination';
import {
  BoothDialog,
  ViewBoothDialog,
  BoothFormState,
} from './components/booth-dialog';
import { AssignAgentsDialog } from './components/assign-agents-dialog';
import {
  EditAgentDialog,
  EditAgentModalData,
} from './components/edit-agent-dialog';
import { ElectionResultDialog } from './components/election-result-dialog';
import { BlaPreviewDialog } from './components/bla-preview-dialog';

const initialBoothFormState: BoothFormState = {
  name: '',
  boothNo: '',
  area: '',
  unionId: '',
  panchayatId: '',
  villageIds: [],
  maleCount: 0,
  femaleCount: 0,
  thirdGenderCount: 0,
  totalCount: 0,
  kilaiIds: [],
  agentIds: [],
  agents: [],
};

const initialElectionFormState: CreateBoothElectionResultDto = {
  electionYear: '2024',
  electionName: '2024 Parliamentary Election',
  totalVotesPolled: 0,
  tvkVotes: 0,
  tvkPercentage: 0,
  topParty1Name: 'DMK',
  topParty1Votes: 0,
  topParty2Name: 'AIADMK',
  topParty2Votes: 0,
  winnerPartyName: '',
  margin: 0,
  notes: '',
};

export default function BoothsPage() {
  const t = useTranslations('Booths');
  const locale = useLocale();

  // Queries & Mutations
  const { data: booths, isLoading } = useBooths();
  const createBooth = useCreateBooth();
  const updateBooth = useUpdateBooth();
  const deleteBooth = useDeleteBooth();

  const addElectionResult = useAddBoothElectionResult();
  const updateElectionResult = useUpdateBoothElectionResult();
  const deleteElectionResult = useDeleteBoothElectionResult();

  const assignBoothElectionAgents = useAssignBoothElectionAgents();
  const updateBoothElectionAgent = useUpdateBoothElectionAgent();
  const removeBoothElectionAgent = useRemoveBoothElectionAgent();

  const { data: dbElections = [] } = useElections();
  const { data: currentElection } = useCurrentElection();
  const { data: unions } = useUnions();
  const { data: kilais } = useKilais();

  // Search, Filters & View Mode
  const [search, setSearch] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [filterUnionId, setFilterUnionId] = useState('');
  const [filterKilaiId, setFilterKilaiId] = useState('');
  const [filterAgentId, setFilterAgentId] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Expansion & Selection State
  const [expandedBoothIds, setExpandedBoothIds] = useState<Record<string, boolean>>({});
  const [selectedElectionId, setSelectedElectionId] = useState<string | undefined>(undefined);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooth, setEditingBooth] = useState<any | null>(null);
  const [viewingBooth, setViewingBooth] = useState<any | null>(null);
  const [formData, setFormData] = useState<BoothFormState>(initialBoothFormState);

  const [isAssignAgentsDialogOpen, setIsAssignAgentsDialogOpen] = useState(false);
  const [assignAgentsBooth, setAssignAgentsBooth] = useState<any | null>(null);
  const [assignAgentsElection, setAssignAgentsElection] = useState<any | null>(null);
  const [assignAgentsSelectedCadres, setAssignAgentsSelectedCadres] = useState<any[]>([]);

  const [editingAgentData, setEditingAgentData] = useState<EditAgentModalData | null>(null);

  const [isElectionDialogOpen, setIsElectionDialogOpen] = useState(false);
  const [electionDialogBooth, setElectionDialogBooth] = useState<any | null>(null);
  const [editingElectionResult, setEditingElectionResult] = useState<BoothElectionResult | null>(null);
  const [electionFormData, setElectionFormData] = useState<CreateBoothElectionResultDto>(initialElectionFormState);

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [callingCadre, setCallingCadre] = useState<{ name: string; phone: string } | null>(null);

  const dataSectionRef = useRef<HTMLDivElement>(null);

  // Administrative hierarchy cascading for Booth Form (only fetched when dialog is open)
  const { data: unionPanchayats } = usePanchayats(
    isDialogOpen && formData.unionId ? formData.unionId : undefined,
    undefined,
    { enabled: isDialogOpen && Boolean(formData.unionId) }
  );
  const { data: panchayatVillages } = useVillages(
    isDialogOpen && formData.panchayatId ? formData.panchayatId : undefined,
    undefined,
    { enabled: isDialogOpen && Boolean(formData.panchayatId) }
  );

  // Default to Grid on mobile (<1024px)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('grid');
    }
  }, []);

  // Set default drawer election if current election becomes available
  useEffect(() => {
    if (!selectedElectionId && currentElection?.id) {
      setSelectedElectionId(currentElection.id);
    }
  }, [currentElection, selectedElectionId]);

  // Comprehensive Search Scoring & Filtering
  const filteredBooths = useMemo(() => {
    if (!booths) return [];

    const rawQuery = (search || '').trim().toLowerCase();
    const cleanNum = rawQuery.replace(/^(?:booth|b|சாவடி)[\s#:\-_]*/i, '').trim();
    const isNumeric = /^\d+$/.test(rawQuery) || /^\d+$/.test(cleanNum);
    const numericQuery = /^\d+$/.test(cleanNum)
      ? cleanNum
      : /^\d+$/.test(rawQuery)
      ? rawQuery
      : '';
    const numericVal = numericQuery ? parseInt(numericQuery, 10) : null;
    const tokens = rawQuery ? rawQuery.split(/\s+/).filter(Boolean) : [];

    // Precompile word regex once outside the loop
    const escaped = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRegex = rawQuery ? new RegExp('(?:^|[\\s,.-])' + escaped + '(?:$|[\\s,.-])', 'i') : null;

    const scoredBooths: { booth: any; score: number }[] = [];

    for (let i = 0; i < booths.length; i++) {
      const b = booths[i];

      // 1. Union filter
      if (
        filterUnionId &&
        b.unionId !== filterUnionId &&
        !b.kilais?.some((k: any) => k.unionId === filterUnionId)
      ) {
        continue;
      }

      // 2. Kilai filter
      if (filterKilaiId && !b.kilais?.some((k: any) => k.id === filterKilaiId)) {
        continue;
      }

      // 3. Agent filter
      if (filterAgentId === 'UNASSIGNED') {
        if (b.agents && b.agents.length > 0) continue;
      } else if (filterAgentId === 'ASSIGNED') {
        if (!b.agents || b.agents.length === 0) continue;
      } else if (filterAgentId) {
        if (!b.agents?.some((a: any) => a.id === filterAgentId)) continue;
      }

      // If no search query, all pass
      if (!rawQuery) {
        scoredBooths.push({ booth: b, score: 1 });
        continue;
      }

      const bNo = String(b.boothNo || '').trim().toLowerCase();
      const bNoNum = parseInt(bNo.replace(/\D/g, ''), 10);
      const bName = String(b.name || '');
      const nameWithoutPincode = bName.replace(/[\s\-,]*\b\d{6}\b/g, '').toLowerCase();
      const shortenedName = shortenBoothName(bName).toLowerCase();
      const areaStr = String(b.area || '').toLowerCase();
      const panchayatEn = String(b.panchayatRel?.name || '').toLowerCase();
      const panchayatTa = String(b.panchayatRel?.nameTa || '').toLowerCase();
      const unionEn = String(b.union?.name || '').toLowerCase();
      const unionTa = String(b.union?.nameTa || '').toLowerCase();
      const villagesStr = (b.villages || [])
        .map((v: any) => `${v.name || ''} ${v.nameTa || ''}`)
        .join(' ')
        .toLowerCase();
      const kilaisStr = (b.kilais || [])
        .map((k: any) => k.name || '')
        .join(' ')
        .toLowerCase();
      const agentsStr = (b.agents || [])
        .map((a: any) => `${a.name || ''} ${isNumeric && numericQuery.length < 4 ? '' : a.phone || ''}`)
        .join(' ')
        .toLowerCase();

      let score = 0;

      // 1. Exact booth number match (e.g. searching "70" matches booth "70")
      if (
        bNo === rawQuery ||
        (cleanNum && bNo === cleanNum) ||
        (numericVal !== null && !isNaN(bNoNum) && bNoNum === numericVal && bNo === String(numericVal))
      ) {
        score = 1000;
      }
      // 2. Booth number starts with query (e.g. searching "70" matches "70A", "70M", "70W")
      else if (bNo.startsWith(rawQuery) || (cleanNum && bNo.startsWith(cleanNum))) {
        score = 800;
      }
      // 3. Booth number contains query as substring (e.g. searching "70" matches "170", "270")
      else if (bNo.includes(rawQuery) || (cleanNum && bNo.includes(cleanNum))) {
        score = 500;
      }
      // 4. Name or Area starts with query
      else if (
        nameWithoutPincode.startsWith(rawQuery) ||
        shortenedName.startsWith(rawQuery) ||
        areaStr.startsWith(rawQuery) ||
        panchayatEn.startsWith(rawQuery)
      ) {
        score = 300;
      }
      // 5. Whole word match
      else if (
        wordRegex && (
          wordRegex.test(nameWithoutPincode) ||
          wordRegex.test(shortenedName) ||
          wordRegex.test(areaStr) ||
          wordRegex.test(panchayatEn)
        )
      ) {
        score = 200;
      } else if (
        nameWithoutPincode.includes(rawQuery) ||
        shortenedName.includes(rawQuery) ||
        areaStr.includes(rawQuery) ||
        panchayatEn.includes(rawQuery) ||
        panchayatTa.includes(rawQuery) ||
        unionEn.includes(rawQuery) ||
        unionTa.includes(rawQuery) ||
        villagesStr.includes(rawQuery) ||
        kilaisStr.includes(rawQuery) ||
        agentsStr.includes(rawQuery)
      ) {
        score = 100;
      } else if (isNumeric && numericQuery.length >= 5 && bName.includes(numericQuery)) {
        score = 90;
      } else if (tokens.length > 1) {
        const allTokensMatch = tokens.every((tok) => {
          const tokClean = tok.replace(/^(?:booth|b|சாவடி)[\s#:\-_]*/i, '').trim();
          const tokNum = /^\d+$/.test(tokClean) ? tokClean : /^\d+$/.test(tok) ? tok : '';
          if (tokNum && (bNo === tokNum || bNo.includes(tokNum))) return true;
          return (
            bNo.includes(tok) ||
            nameWithoutPincode.includes(tok) ||
            shortenedName.includes(tok) ||
            areaStr.includes(tok) ||
            panchayatEn.includes(tok) ||
            panchayatTa.includes(tok) ||
            unionEn.includes(tok) ||
            unionTa.includes(tok) ||
            villagesStr.includes(tok) ||
            kilaisStr.includes(tok) ||
            agentsStr.includes(tok)
          );
        });
        if (allTokensMatch) {
          score = 150;
        }
      }

      if (score > 0) {
        scoredBooths.push({ booth: b, score });
      }
    }

    const parseBoothNum = (s: string) => {
      const n = parseInt(String(s).replace(/\D/g, ''), 10);
      return isNaN(n) ? 0 : n;
    };

    if (rawQuery) {
      scoredBooths.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const diff = parseBoothNum(a.booth.boothNo) - parseBoothNum(b.booth.boothNo);
        if (diff !== 0) return diff;
        return a.booth.boothNo.localeCompare(b.booth.boothNo);
      });
    } else {
      scoredBooths.sort((a, b) => {
        const diff = parseBoothNum(a.booth.boothNo) - parseBoothNum(b.booth.boothNo);
        if (diff !== 0) return diff;
        return a.booth.boothNo.localeCompare(b.booth.boothNo);
      });
    }

    return scoredBooths.map((item) => item.booth);
  }, [booths, search, filterUnionId, filterKilaiId, filterAgentId]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredBooths.length / itemsPerPage);
  const paginatedBooths = useMemo(() => {
    return filteredBooths.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredBooths, currentPage, itemsPerPage]);

  // Drawer Expansion Handlers
  const toggleExpand = useCallback((id: string) => {
    setExpandedBoothIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const allExpanded =
    paginatedBooths.length > 0 && paginatedBooths.every((b: any) => expandedBoothIds[b.id]);

  const toggleAllExpanded = useCallback(() => {
    if (allExpanded) {
      setExpandedBoothIds({});
    } else {
      const next: Record<string, boolean> = {};
      paginatedBooths.forEach((b: any) => {
        next[b.id] = true;
      });
      setExpandedBoothIds(next);
    }
  }, [allExpanded, paginatedBooths]);

  // CSV Export
  const handleExportCsv = useCallback(() => {
    if (!filteredBooths || filteredBooths.length === 0) return;

    const headers = [
      'Booth Number',
      'Booth Name',
      'Area',
      'Panchayat',
      'Union',
      'Male Count',
      'Female Count',
      'Third Gender Count',
      'Total Count',
      'Recent TVK Votes',
      'Recent TVK Vote %',
      'Recent Election',
      'Linked Kilais',
      'Assigned Agents',
    ];

    const rows = filteredBooths.map((b: any) => {
      const recent =
        b.electionResults && b.electionResults.length > 0 ? b.electionResults[0] : null;
      return [
        `"${String(b.boothNo || '').replace(/"/g, '""')}"`,
        `"${String(b.name || '').replace(/"/g, '""')}"`,
        `"${String(b.area || '').replace(/"/g, '""')}"`,
        `"${String(b.panchayatRel?.name || '').replace(/"/g, '""')}"`,
        `"${String(b.union?.name || '').replace(/"/g, '""')}"`,
        b.maleCount || 0,
        b.femaleCount || 0,
        b.thirdGenderCount || 0,
        b.totalCount || 0,
        recent ? recent.tvkVotes : '',
        recent ? `${recent.tvkPercentage}%` : '',
        recent
          ? `"${String(recent.electionName || recent.electionYear).replace(/"/g, '""')}"`
          : '',
        `"${(b.kilais || []).map((k: any) => k.name).join('; ').replace(/"/g, '""')}"`,
        `"${(b.agents || [])
          .map((a: any) => `${a.name}${a.phone ? ` (${a.phone})` : ''}`)
          .join('; ')
          .replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `booths_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredBooths]);

  // Add / Edit Booth Dialog Handlers
  const handleOpenBoothDialog = useCallback((booth?: any) => {
    if (booth) {
      setEditingBooth(booth);
      setFormData({
        name: booth.name || '',
        boothNo: booth.boothNo || '',
        area: booth.area || '',
        unionId: booth.unionId || '',
        panchayatId: booth.panchayatId || '',
        villageIds: booth.villages?.map((v: any) => v.id) || [],
        maleCount: booth.maleCount || 0,
        femaleCount: booth.femaleCount || 0,
        thirdGenderCount: booth.thirdGenderCount || 0,
        totalCount: booth.totalCount || 0,
        kilaiIds: booth.kilais?.map((k: any) => k.id) || [],
        agentIds: booth.agents?.map((a: any) => a.id) || [],
        agents: booth.agents || [],
      });
    } else {
      setEditingBooth(null);
      setFormData(initialBoothFormState);
    }
    setIsDialogOpen(true);
  }, []);

  const handleSubmitBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { agents, ...restFormData } = formData;
      const payload = {
        ...restFormData,
        unionId:
          restFormData.unionId && restFormData.unionId !== '__NONE__'
            ? restFormData.unionId
            : null,
        panchayatId:
          restFormData.panchayatId && restFormData.panchayatId !== '__NONE__'
            ? restFormData.panchayatId
            : null,
        maleCount: Number(restFormData.maleCount) || 0,
        femaleCount: Number(restFormData.femaleCount) || 0,
        thirdGenderCount: Number(restFormData.thirdGenderCount) || 0,
        totalCount: Number(restFormData.totalCount) || 0,
      };

      if (editingBooth) {
        await updateBooth.mutateAsync({ id: editingBooth.id, data: payload });
      } else {
        await createBooth.mutateAsync(payload);
      }
      setIsDialogOpen(false);
      setFormData(initialBoothFormState);
    } catch (error) {
      console.error('Failed to save booth', error);
      alert(t('errorSaving'));
    }
  };

  const handleDeleteBooth = useCallback(async (id: string) => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        await deleteBooth.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete booth', error);
        alert(t('errorDeleting'));
      }
    }
  }, [deleteBooth, t]);

  // Assign Agents Dialog Handlers
  const handleOpenAssignAgentsDialog = useCallback((booth: any, election?: any) => {
    const targetElection =
      election || currentElection || (dbElections.length > 0 ? dbElections[0] : null);
    setAssignAgentsBooth(booth);
    setAssignAgentsElection(targetElection);

    if (targetElection) {
      const assignments = (booth.agentAssignments || []).filter(
        (a: any) => a.electionId === targetElection.id
      );
      if (assignments.length > 0) {
        setAssignAgentsSelectedCadres(
          assignments.map((a: any) => ({
            ...(a.cadre || a),
            role: a.role || 'Booth Agent',
            blaFormUrl: a.blaFormUrl || null,
            notes: a.notes || '',
          }))
        );
      } else if (targetElection.isCurrent && booth.agents && booth.agents.length > 0) {
        setAssignAgentsSelectedCadres(
          booth.agents.map((a: any) => ({
            ...a,
            role: a.role || 'Booth Agent',
            blaFormUrl: a.blaFormUrl || null,
            notes: a.notes || '',
          }))
        );
      } else {
        setAssignAgentsSelectedCadres([]);
      }
    } else {
      setAssignAgentsSelectedCadres(
        (booth.agents || []).map((a: any) => ({
          ...a,
          role: a.role || 'Booth Agent',
          blaFormUrl: a.blaFormUrl || null,
          notes: a.notes || '',
        }))
      );
    }
    setIsAssignAgentsDialogOpen(true);
  }, [currentElection, dbElections]);

  const handleSaveAssignAgents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignAgentsBooth || !assignAgentsElection) return;
    try {
      await assignBoothElectionAgents.mutateAsync({
        boothId: assignAgentsBooth.id,
        electionId: assignAgentsElection.id,
        agents: assignAgentsSelectedCadres.map((c: any) => ({
          cadreId: c.id,
          role: c.role || 'Booth Agent',
          blaFormUrl: c.blaFormUrl || null,
          notes: c.notes || null,
        })),
        role: 'Booth Agent',
      });
      setIsAssignAgentsDialogOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving booth agents');
    }
  };

  // Edit Single Agent Modal Handlers
  const handleOpenEditAgentDialog = useCallback((booth: any, election: any, agent: any) => {
    setEditingAgentData({
      booth,
      election,
      agent,
      cadreId: agent.cadreId || agent.id,
      role: agent.assignmentRole || agent.role || 'Booth Agent',
      blaFormUrl: agent.blaFormUrl || null,
      notes: agent.assignmentNotes || agent.notes || '',
    });
  }, []);

  const handleSaveEditAgent = useCallback(async (saveData: {
    boothId: string;
    electionId: string;
    cadreId: string;
    role: string;
    blaFormUrl: string | null;
    notes: string;
  }) => {
    try {
      await updateBoothElectionAgent.mutateAsync({
        boothId: saveData.boothId,
        electionId: saveData.electionId,
        cadreId: saveData.cadreId,
        data: {
          role: saveData.role,
          blaFormUrl: saveData.blaFormUrl,
          notes: saveData.notes,
        },
      });
      setEditingAgentData(null);
    } catch (err: any) {
      alert(err.message || 'Error updating booth agent');
    }
  }, [updateBoothElectionAgent]);

  const handleRemoveBoothElectionAgent = useCallback(async (
    boothId: string,
    electionId: string,
    cadreId: string
  ) => {
    if (
      confirm(
        locale === 'ta'
          ? 'இந்த முகவரை நீக்க விரும்புகிறீர்களா?'
          : 'Are you sure you want to remove this booth agent for this election?'
      )
    ) {
      try {
        await removeBoothElectionAgent.mutateAsync({
          boothId,
          electionId,
          cadreId,
        });
      } catch (err: any) {
        alert(err.message || 'Error removing agent');
      }
    }
  }, [locale, removeBoothElectionAgent]);

  // Election Results Dialog Handlers
  const handleOpenAddElectionDialog = useCallback((booth: any) => {
    setElectionDialogBooth(booth);
    setEditingElectionResult(null);
    setElectionFormData({
      ...initialElectionFormState,
      totalVotesPolled: booth.totalCount ? Math.round(booth.totalCount * 0.75) : 0,
    });
    setIsElectionDialogOpen(true);
  }, []);

  const handleOpenEditElectionDialog = useCallback((booth: any, result: BoothElectionResult) => {
    setElectionDialogBooth(booth);
    setEditingElectionResult(result);
    setElectionFormData({
      electionYear: result.electionYear,
      electionName: result.electionName,
      totalVotesPolled: result.totalVotesPolled,
      tvkVotes: result.tvkVotes,
      tvkPercentage: result.tvkPercentage,
      topParty1Name: result.topParty1Name || '',
      topParty1Votes: result.topParty1Votes || 0,
      topParty2Name: result.topParty2Name || '',
      topParty2Votes: result.topParty2Votes || 0,
      winnerPartyName: result.winnerPartyName || '',
      margin: result.margin || 0,
      notes: result.notes || '',
    });
    setIsElectionDialogOpen(true);
  }, []);

  const handleSaveElectionResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electionDialogBooth) return;

    try {
      const polled = Number(electionFormData.totalVotesPolled) || 0;
      const tvk = Number(electionFormData.tvkVotes) || 0;
      const p1Votes = Number(electionFormData.topParty1Votes) || 0;
      const p2Votes = Number(electionFormData.topParty2Votes) || 0;
      const pct = polled > 0 ? Math.round((tvk / polled) * 10000) / 100 : 0;

      const candidates = [
        { name: 'TVK', votes: tvk },
        { name: electionFormData.topParty1Name || 'Party 1', votes: p1Votes },
        { name: electionFormData.topParty2Name || 'Party 2', votes: p2Votes },
      ].sort((a, b) => b.votes - a.votes);

      const computedWinner = candidates[0].name;
      const computedMargin = candidates[0].votes - (candidates[1]?.votes || 0);

      const payload: CreateBoothElectionResultDto = {
        ...electionFormData,
        totalVotesPolled: polled,
        tvkVotes: tvk,
        tvkPercentage: pct,
        topParty1Votes: p1Votes,
        topParty2Votes: p2Votes,
        winnerPartyName: electionFormData.winnerPartyName || computedWinner,
        margin: computedMargin,
      };

      if (editingElectionResult) {
        await updateElectionResult.mutateAsync({
          boothId: electionDialogBooth.id,
          resultId: editingElectionResult.id,
          data: payload,
        });
      } else {
        await addElectionResult.mutateAsync({
          boothId: electionDialogBooth.id,
          data: payload,
        });
      }

      setIsElectionDialogOpen(false);
      setEditingElectionResult(null);
    } catch (error) {
      console.error('Failed to save election result', error);
      alert('Error saving election result');
    }
  };

  const handleDeleteElectionResult = useCallback(async (boothId: string, resultId: string) => {
    if (window.confirm(t('deleteResultConfirm'))) {
      try {
        await deleteElectionResult.mutateAsync({ boothId, resultId });
      } catch (error) {
        console.error('Failed to delete election result', error);
        alert('Error deleting election result');
      }
    }
  }, [deleteElectionResult, t]);

  const handleScrollToData = useCallback(() => {
    dataSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    setCurrentPage(1);
  }, []);

  const handleToggleAdvanced = useCallback(() => {
    setIsAdvancedOpen((prev) => !prev);
  }, []);

  const handleUnionChange = useCallback((val: string) => {
    setFilterUnionId(val);
    setCurrentPage(1);
  }, []);

  const handleKilaiChange = useCallback((val: string) => {
    setFilterKilaiId(val);
    setCurrentPage(1);
  }, []);

  const handleAgentStatusChange = useCallback((val: string) => {
    setFilterAgentId(val);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setFilterUnionId('');
    setFilterKilaiId('');
    setFilterAgentId('');
    setCurrentPage(1);
  }, []);

  const handleCloseViewBooth = useCallback(() => setViewingBooth(null), []);
  const handleClosePreviewImage = useCallback(() => setPreviewImageUrl(null), []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold uppercase tracking-wide text-primary">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">
            {t('description')}
          </p>
        </div>
        <Button
          onClick={() => handleOpenBoothDialog()}
          className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95"
        >
          <Plus className="mr-2 h-5 w-5" /> {t('addBooth')}
        </Button>
      </div>

      {/* Top Metrics Cards */}
      <BoothsMetrics
        booths={booths}
        onScrollToData={handleScrollToData}
      />

      {/* Search, Advanced Filters, View Switcher & Export */}
      <BoothsFilters
        search={search}
        onSearchChange={handleSearchChange}
        isAdvancedOpen={isAdvancedOpen}
        onToggleAdvanced={handleToggleAdvanced}
        filterUnionId={filterUnionId}
        onUnionChange={handleUnionChange}
        filterKilaiId={filterKilaiId}
        onKilaiChange={handleKilaiChange}
        filterAgentId={filterAgentId}
        onAgentStatusChange={handleAgentStatusChange}
        onClearFilters={handleClearFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExportCsv={handleExportCsv}
        hasPaginatedBooths={paginatedBooths.length > 0}
        allExpanded={allExpanded}
        onToggleAllExpanded={toggleAllExpanded}
        unions={unions}
        kilais={kilais}
        dataSectionRef={dataSectionRef}
      />

      {/* Main Data Section: Table or Grid */}
      {viewMode === 'list' ? (
        <BoothsTableView
          booths={paginatedBooths}
          isLoading={isLoading}
          currentElection={currentElection}
          expandedBoothIds={expandedBoothIds}
          onToggleExpand={toggleExpand}
          selectedElectionId={selectedElectionId}
          onSelectElectionId={setSelectedElectionId}
          dbElections={dbElections}
          onOpenDialog={handleOpenBoothDialog}
          onDelete={handleDeleteBooth}
          onOpenAssignAgentsDialog={handleOpenAssignAgentsDialog}
          onOpenEditAgentDialog={handleOpenEditAgentDialog}
          onRemoveBoothElectionAgent={handleRemoveBoothElectionAgent}
          onOpenAddElectionDialog={handleOpenAddElectionDialog}
          onOpenEditElectionDialog={handleOpenEditElectionDialog}
          onDeleteElectionResult={handleDeleteElectionResult}
          onPreviewImage={setPreviewImageUrl}
          onCallCadre={setCallingCadre}
        />
      ) : (
        <BoothsGridView
          booths={paginatedBooths}
          isLoading={isLoading}
          currentElection={currentElection}
          onOpenDialog={handleOpenBoothDialog}
          onDelete={handleDeleteBooth}
          onOpenAssignAgentsDialog={handleOpenAssignAgentsDialog}
          onOpenAddElectionDialog={handleOpenAddElectionDialog}
          onOpenEditElectionDialog={handleOpenEditElectionDialog}
          onPreviewImage={setPreviewImageUrl}
          onSelectBooth={setViewingBooth}
        />
      )}

      {/* Pagination Controls */}
      <BoothsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={filteredBooths.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Booth Dialog */}
      <BoothDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingBooth={editingBooth}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmitBooth}
        isPending={createBooth.isPending || updateBooth.isPending}
        unions={unions}
        unionPanchayats={unionPanchayats}
        panchayatVillages={panchayatVillages}
        kilais={kilais}
      />

      {/* View Booth Details Dialog */}
      <ViewBoothDialog
        booth={viewingBooth}
        onClose={handleCloseViewBooth}
      />

      {/* Assign Booth Agents Dialog */}
      <AssignAgentsDialog
        open={isAssignAgentsDialogOpen}
        onOpenChange={setIsAssignAgentsDialogOpen}
        booth={assignAgentsBooth}
        election={assignAgentsElection}
        selectedCadres={assignAgentsSelectedCadres}
        onSelectedCadresChange={setAssignAgentsSelectedCadres}
        onSave={handleSaveAssignAgents}
        isPending={assignBoothElectionAgents.isPending}
        onPreviewImage={setPreviewImageUrl}
      />

      {/* Edit Single Booth Agent Modal (Designation/Role control removed) */}
      <EditAgentDialog
        data={editingAgentData}
        onClose={() => setEditingAgentData(null)}
        onSave={handleSaveEditAgent}
        isPending={updateBoothElectionAgent.isPending}
        onPreviewImage={setPreviewImageUrl}
      />

      {/* Add / Edit Past Election Results Dialog */}
      <ElectionResultDialog
        open={isElectionDialogOpen}
        onOpenChange={setIsElectionDialogOpen}
        booth={electionDialogBooth}
        editingResult={editingElectionResult}
        formData={electionFormData}
        onFormDataChange={setElectionFormData}
        onSubmit={handleSaveElectionResult}
        isPending={addElectionResult.isPending || updateElectionResult.isPending}
        dbElections={dbElections}
      />

      {/* High-Res BLA Form Preview Modal */}
      <BlaPreviewDialog
        imageUrl={previewImageUrl}
        onClose={handleClosePreviewImage}
      />

      {/* Cadre Call Confirmation Dialog */}
      <CallConfirmationDialog
        person={callingCadre}
        onOpenChange={(open) => !open && setCallingCadre(null)}
      />
    </div>
  );
}
