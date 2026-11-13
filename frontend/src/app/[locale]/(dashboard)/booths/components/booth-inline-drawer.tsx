'use client';

import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  ChevronUp,
  MapPin,
  Trophy,
  Vote,
  Plus,
  Phone,
  FileText,
  Eye,
  Pencil,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getOrgUnitName } from '@/lib/org-unit-translations';
import { ElectionSelect } from '@/components/shared/election-select';
import { translatePersonNameToTamil } from '@/lib/name-translations';
import { cn } from '@/lib/utils';

export interface BoothInlineDrawerProps {
  booth: any;
  selectedElectionId?: string;
  onSelectElectionId: (electionId: string) => void;
  dbElections: any[];
  currentElection: any;
  onOpenAssignAgentsDialog: (booth: any, election?: any) => void;
  onOpenEditAgentDialog: (booth: any, election: any, agent: any) => void;
  onRemoveBoothElectionAgent: (boothId: string, electionId: string, cadreId: string) => void;
  onOpenAddElectionDialog: (booth: any) => void;
  onOpenEditElectionDialog: (booth: any, result: any) => void;
  onDeleteElectionResult: (boothId: string, resultId: string) => void;
  onPreviewImage: (url: string) => void;
  onCallCadre: (cadre: { name: string; phone: string }) => void;
  onCollapse: () => void;
}

export function BoothInlineDrawerComponent({
  booth,
  selectedElectionId,
  onSelectElectionId,
  dbElections,
  currentElection,
  onOpenAssignAgentsDialog,
  onOpenEditAgentDialog,
  onRemoveBoothElectionAgent,
  onOpenAddElectionDialog,
  onOpenEditElectionDialog,
  onDeleteElectionResult,
  onPreviewImage,
  onCallCadre,
  onCollapse,
}: BoothInlineDrawerProps) {
  const locale = useLocale();
  const t = useTranslations('Booths');

  const [localElectionId, setLocalElectionId] = React.useState<string>(
    selectedElectionId || currentElection?.id || (dbElections[0]?.id ?? '')
  );

  React.useEffect(() => {
    if (selectedElectionId) {
      setLocalElectionId(selectedElectionId);
    }
  }, [selectedElectionId]);

  const maleCount = Number(booth.maleCount) || 0;
  const femaleCount = Number(booth.femaleCount) || 0;
  const thirdCount = Number(booth.thirdGenderCount) || 0;
  const totalCount =
    Number(booth.totalCount) || maleCount + femaleCount + thirdCount;

  const malePct =
    totalCount > 0 ? Math.round((maleCount / totalCount) * 100) : 0;
  const femalePct =
    totalCount > 0 ? Math.round((femaleCount / totalCount) * 100) : 0;
  const thirdPct =
    totalCount > 0 ? Math.round((thirdCount / totalCount) * 100) : 0;

  const drawerElectionId =
    localElectionId ||
    currentElection?.id ||
    (dbElections.length > 0 ? dbElections[0]?.id : '');
  const activeDrawerElection =
    dbElections.find((e: any) => e.id === drawerElectionId) ||
    currentElection ||
    dbElections[0];

  const assignmentsForElection = (booth.agentAssignments || []).filter(
    (a: any) => a.electionId === drawerElectionId
  );

  const electionAgents =
    assignmentsForElection.length > 0
      ? assignmentsForElection.map((a: any) => ({
          ...a.cadre,
          assignmentRole: a.role,
          assignmentId: a.id,
          electionId: a.electionId,
          blaFormUrl: a.blaFormUrl || a.cadre?.blaFormUrl || a.cadre?.attachments?.blaForm || a.cadre?.attachments?.blaFormUrl || null,
          assignmentNotes: a.notes,
        }))
      : activeDrawerElection?.isCurrent && booth.agents?.length
      ? booth.agents
      : [];

  return (
    <TableRow className="bg-[#f3f3ed] hover:bg-[#f3f3ed] dark:bg-zinc-850/60 dark:hover:bg-zinc-850/60 border-b border-primary/20">
      <TableCell colSpan={7} className="p-0">
        <div className="w-full max-w-full min-w-0 border-l-4 border-l-primary bg-[#f5f4f0] dark:bg-zinc-900/95 p-3.5 sm:p-5 md:p-6 space-y-4 overflow-hidden">
          {/* Drawer Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-primary/15 dark:border-zinc-800">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="bg-primary text-white text-xs font-bold font-mono px-2.5 py-0.5 rounded-md shadow-2xs shrink-0">
                  #{booth.boothNo}
                </span>
                {booth.area && (
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700 shrink-0">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span>{booth.area}</span>
                  </span>
                )}
                {booth.panchayatRel && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary shrink-0">
                    <MapPin className="w-3 h-3" />
                    {locale === 'ta' && booth.panchayatRel.nameTa
                      ? booth.panchayatRel.nameTa
                      : booth.panchayatRel.name}
                  </span>
                )}
                {booth.union && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground shrink-0">
                    <Building2 className="w-3 h-3" />
                    {getOrgUnitName(booth.union, locale)}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug break-words">
                {booth.name}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={onCollapse}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <span>{locale === 'ta' ? 'சுருக்கு' : 'Collapse'}</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Voter Demographics Matrix */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-gray-800 dark:text-zinc-200">
              <span className="flex items-center gap-1.5 text-primary">
                <Users className="w-4 h-4" />
                <span>{t('demographics')}</span>
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {t('total')}:{' '}
                <span className="font-bold text-gray-900 dark:text-white">
                  {totalCount.toLocaleString()}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 border border-blue-200/60 dark:border-blue-900/40 shadow-2xs">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate"
                    title={t('male')}
                  >
                    {t('male')}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                    {malePct}%
                  </span>
                </div>
                <p className="text-base sm:text-lg font-extrabold font-mono text-gray-900 dark:text-white mt-1">
                  {maleCount.toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 border border-pink-200/60 dark:border-pink-900/40 shadow-2xs">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-xs font-semibold text-pink-700 dark:text-pink-300 truncate"
                    title={t('female')}
                  >
                    {t('female')}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-pink-600 dark:text-pink-400 shrink-0">
                    {femalePct}%
                  </span>
                </div>
                <p className="text-base sm:text-lg font-extrabold font-mono text-gray-900 dark:text-white mt-1">
                  {femaleCount.toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 border border-purple-200/60 dark:border-purple-900/40 shadow-2xs">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-xs font-semibold text-purple-700 dark:text-purple-300 truncate"
                    title={t('thirdGender')}
                  >
                    {t('thirdGender')}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 shrink-0">
                    {thirdPct}%
                  </span>
                </div>
                <p className="text-base sm:text-lg font-extrabold font-mono text-gray-900 dark:text-white mt-1">
                  {thirdCount.toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 border border-primary/30 shadow-2xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-primary truncate">
                    {t('total')}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-primary shrink-0">
                    100%
                  </span>
                </div>
                <p className="text-base sm:text-lg font-extrabold font-mono text-primary mt-1">
                  {totalCount.toLocaleString()}
                </p>
              </div>
            </div>

            {totalCount > 0 && (
              <div className="w-full h-2 rounded-full bg-gray-200/70 dark:bg-zinc-800 flex overflow-hidden">
                <div
                  style={{ width: `${malePct}%` }}
                  className="bg-blue-500 h-full"
                  title={`Male: ${malePct}%`}
                />
                <div
                  style={{ width: `${femalePct}%` }}
                  className="bg-pink-500 h-full"
                  title={`Female: ${femalePct}%`}
                />
                {thirdCount > 0 && (
                  <div
                    style={{ width: `${thirdPct}%` }}
                    className="bg-purple-500 h-full"
                    title={`Other: ${thirdPct}%`}
                  />
                )}
              </div>
            )}
          </div>

          {/* Villages / Hamlets Covered */}
          {booth.villages && booth.villages.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-primary/10 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>
                  {locale === 'ta'
                    ? 'வாக்குச்சாவடிக்குட்பட்ட கிராமங்கள் / குடியிருப்புகள்'
                    : 'Villages / Hamlets Covered'}
                </span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {booth.villages.map((v: any) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40"
                  >
                    {locale === 'ta' && v.nameTa ? v.nameTa : v.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Linked Kilais */}
          {booth.kilais && booth.kilais.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-primary/10 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-green-600" />
                <span>{t('linkedKilais')}</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {booth.kilais.map((k: any, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white dark:bg-zinc-800 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/40"
                  >
                    {k.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Booth Agents Section - Managed per election */}
          <div className="space-y-3 pt-1 border-t border-primary/10 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Users className="w-3.5 h-3.5 text-primary" />
                <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <span>{t('agentsCadres')}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {electionAgents.length}
                  </span>
                </h4>

                {/* Election Filter Switcher */}
                <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                  <span className="text-[11px] text-muted-foreground font-semibold hidden sm:inline">
                    {t('forElection')}:
                  </span>
                  <ElectionSelect
                    value={drawerElectionId}
                    elections={dbElections}
                    onValueChange={(val) => {
                      if (val) {
                        setLocalElectionId(val);
                        onSelectElectionId?.(val);
                      }
                    }}
                    size="sm"
                    className="bg-white dark:bg-zinc-800 border-primary/25 hover:border-primary/50 w-auto min-w-[220px] max-w-full sm:max-w-[480px] shadow-2xs"
                  />
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onOpenAssignAgentsDialog(booth, activeDrawerElection)
                }
                className="h-7 text-xs font-semibold text-primary border-primary/20 hover:bg-primary/10 hover:text-primary gap-1 shrink-0 self-start sm:self-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('assignAgentsForElection')}</span>
              </Button>
            </div>

            {electionAgents.length > 0 ? (
              <div className="grid gap-2 sm:gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {electionAgents.map((agent: any) => {
                  const agentName =
                    locale === 'ta'
                      ? translatePersonNameToTamil(agent.name) || agent.name
                      : agent.name;
                  return (
                    <div
                      key={agent.id || agent.name}
                      className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700/80 shadow-2xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 group/agent"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-full bg-red-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                          {agent.name?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                            {agentName}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[10px] text-muted-foreground truncate">
                              {agent.assignmentRole ||
                                agent.designation ||
                                agent.role ||
                                (locale === 'ta' ? 'சாவடி முகவர்' : 'Booth Agent')}
                            </span>
                            {(agent.blaFormUrl || agent.attachments?.blaForm || agent.attachments?.blaFormUrl) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreviewImage(agent.blaFormUrl || agent.attachments?.blaForm || agent.attachments?.blaFormUrl);
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
                                title="View BLA Form"
                              >
                                <FileText className="w-2.5 h-2.5" />
                                <span>BLA Form</span>
                                <Eye className="w-2.5 h-2.5 opacity-70" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {agent.phone && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCallCadre({
                                name: agentName,
                                phone: agent.phone,
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <Phone className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{agent.phone}</span>
                          </button>
                        )}
                        {activeDrawerElection && (
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded opacity-80 sm:opacity-0 group-hover/agent:opacity-100 transition-opacity cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditAgentDialog(
                                  booth,
                                  activeDrawerElection,
                                  agent
                                );
                              }}
                              title={
                                locale === 'ta'
                                  ? 'முகவர் விவரங்களைத் திருத்து'
                                  : 'Edit agent details & BLA Form'
                              }
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded opacity-80 sm:opacity-0 group-hover/agent:opacity-100 transition-opacity cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveBoothElectionAgent(
                                  booth.id,
                                  activeDrawerElection.id,
                                  agent.id
                                );
                              }}
                              title="Remove agent for this election"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white/60 dark:bg-zinc-800/40 border border-dashed border-gray-200 dark:border-zinc-700 text-center flex flex-col items-center justify-center gap-1.5">
                <p className="text-xs text-muted-foreground">
                  {locale === 'ta'
                    ? `${activeDrawerElection?.year || ''} தேர்தலுக்கான முகவர்கள் இன்னும் நியமிக்கப்படவில்லை.`
                    : `No agents assigned for the ${activeDrawerElection?.year || ''} election yet.`}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onOpenAssignAgentsDialog(booth, activeDrawerElection)
                  }
                  className="h-7 text-xs font-semibold text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('assignAgentsForElection')}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Past Election Results Section */}
          <div className="space-y-3 pt-2 border-t border-primary/10 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>{t('pastElectionResults')}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {booth.electionResults?.length || 0}
                  </span>
                </h4>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onOpenAddElectionDialog(booth)}
                className="h-7 text-xs font-semibold text-primary border-primary/20 hover:bg-primary/10 hover:text-primary gap-1 self-start sm:self-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('addElectionResult')}</span>
              </Button>
            </div>

            {booth.electionResults && booth.electionResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {booth.electionResults.map((result: any) => {
                  const isTVKWinner =
                    result.winnerPartyName === 'TVK' ||
                    result.tvkVotes > (result.topParty1Votes || 0);
                  return (
                    <div
                      key={result.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/90 border border-gray-200/90 dark:border-zinc-700/80 shadow-2xs space-y-3 relative group"
                    >
                      {/* Header: Election Name, Year & Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200">
                              {result.electionYear}
                            </span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {result.electionName}
                            </span>
                          </div>
                          {result.totalVotesPolled && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {t('totalVotesPolled')}:{' '}
                              <span className="font-semibold text-foreground">
                                {result.totalVotesPolled.toLocaleString()}
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-primary hover:bg-primary/10 rounded cursor-pointer"
                            onClick={() =>
                              onOpenEditElectionDialog(booth, result)
                            }
                            title={t('editElectionResult')}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                            onClick={() =>
                              onDeleteElectionResult(booth.id, result.id)
                            }
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* TVK Vote Share Card / Banner */}
                      <div
                        className={cn(
                          'p-2.5 rounded-lg border flex items-center justify-between gap-2',
                          isTVKWinner
                            ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800/40'
                            : 'bg-red-50/50 border-red-200/80 dark:bg-red-950/20 dark:border-red-900/40'
                        )}
                      >
                        <div>
                          <p className="text-[10px] font-bold text-[#8F0A1B] dark:text-red-400 uppercase tracking-wide">
                            TVK {locale === 'ta' ? 'வாக்குகள்' : 'Votes'}
                          </p>
                          <p className="text-base font-extrabold text-[#8F0A1B] dark:text-red-300 font-mono">
                            {result.tvkVotes?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              'inline-block px-2 py-0.5 rounded text-xs font-extrabold font-mono',
                              isTVKWinner
                                ? 'bg-[#FFC72C] text-[#8F0A1B] shadow-2xs'
                                : 'bg-[#8F0A1B] text-white'
                            )}
                          >
                            {result.tvkPercentage}%
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {t('tvkVoteShare')}
                          </p>
                        </div>
                      </div>

                      {/* Competitors Breakdown */}
                      {(result.topParty1Name || result.topParty2Name) && (
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-dashed border-gray-200 dark:border-zinc-700">
                          {result.topParty1Name && (
                            <div className="p-1.5 rounded bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-750">
                              <p className="text-[10px] text-muted-foreground truncate font-medium">
                                {result.topParty1Name}
                              </p>
                              <p className="font-bold font-mono text-gray-800 dark:text-zinc-200">
                                {result.topParty1Votes
                                  ? result.topParty1Votes.toLocaleString()
                                  : '—'}
                              </p>
                            </div>
                          )}
                          {result.topParty2Name && (
                            <div className="p-1.5 rounded bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-750">
                              <p className="text-[10px] text-muted-foreground truncate font-medium">
                                {result.topParty2Name}
                              </p>
                              <p className="font-bold font-mono text-gray-800 dark:text-zinc-200">
                                {result.topParty2Votes
                                  ? result.topParty2Votes.toLocaleString()
                                  : '—'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Winner / Margin footer */}
                      {(result.winnerPartyName || result.margin) && (
                        <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground">
                          {result.winnerPartyName && (
                            <span className="truncate">
                              {t('winner')}:{' '}
                              <span className="font-bold text-foreground">
                                {result.winnerPartyName}
                              </span>
                            </span>
                          )}
                          {result.margin && (
                            <span className="font-mono shrink-0">
                              {t('margin')}:{' '}
                              <span className="font-semibold text-foreground">
                                +{result.margin.toLocaleString()}
                              </span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes if any */}
                      {result.notes && (
                        <p className="text-[11px] italic text-muted-foreground bg-gray-50 dark:bg-zinc-800 p-1.5 rounded border border-gray-100 dark:border-zinc-700">
                          {result.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/60 dark:bg-zinc-800/40 border border-dashed border-gray-200 dark:border-zinc-700 text-center flex flex-col items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  {t('noElectionResults')}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenAddElectionDialog(booth)}
                  className="h-7 text-xs font-semibold text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('addElectionResult')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export const BoothInlineDrawer = React.memo(BoothInlineDrawerComponent);

