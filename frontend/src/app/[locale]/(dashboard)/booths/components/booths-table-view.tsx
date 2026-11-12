'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  MapPin,
  FileText,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { translatePersonNameToTamil } from '@/lib/name-translations';
import { cn } from '@/lib/utils';
import { BoothInlineDrawer } from './booth-inline-drawer';

interface BoothTableRowProps {
  booth: any;
  isExpanded: boolean;
  currentElection: any;
  onToggleExpand: (boothId: string) => void;
  selectedElectionId?: string;
  onSelectElectionId: (electionId: string) => void;
  dbElections: any[];
  onOpenDialog: (booth: any) => void;
  onDelete: (boothId: string) => void;
  onOpenAssignAgentsDialog: (booth: any, election?: any) => void;
  onOpenEditAgentDialog: (booth: any, election: any, agent: any) => void;
  onRemoveBoothElectionAgent: (boothId: string, electionId: string, cadreId: string) => void;
  onOpenAddElectionDialog: (booth: any) => void;
  onOpenEditElectionDialog: (booth: any, result: any) => void;
  onDeleteElectionResult: (boothId: string, resultId: string) => void;
  onPreviewImage: (url: string) => void;
  onCallCadre: (cadre: { name: string; phone: string }) => void;
}

const BoothTableRow = React.memo(function BoothTableRow({
  booth,
  isExpanded,
  currentElection,
  onToggleExpand,
  selectedElectionId,
  onSelectElectionId,
  dbElections,
  onOpenDialog,
  onDelete,
  onOpenAssignAgentsDialog,
  onOpenEditAgentDialog,
  onRemoveBoothElectionAgent,
  onOpenAddElectionDialog,
  onOpenEditElectionDialog,
  onDeleteElectionResult,
  onPreviewImage,
  onCallCadre,
}: BoothTableRowProps) {
  const locale = useLocale();
  const t = useTranslations('Booths');

  const agentsList =
    booth.latestAgents && booth.latestAgents.length > 0
      ? booth.latestAgents
      : booth.agents || [];
  const recentElection =
    booth.electionResults && booth.electionResults.length > 0
      ? booth.electionResults[0]
      : null;

  return (
    <React.Fragment key={booth.id}>
      {/* Main Table Row */}
      <TableRow
        onClick={() => onToggleExpand(booth.id)}
        className={`transition-colors group border-b cursor-pointer select-none ${
          isExpanded
            ? 'bg-[#f3f3de] border-primary/20'
            : 'hover:bg-[#eae8d3] border-b-primary/10'
        }`}
      >
        <TableCell className="py-4 w-[26%] min-w-[170px] max-w-[500px] whitespace-normal break-words">
          <div className="flex items-center gap-2 min-w-0 max-w-[500px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(booth.id);
              }}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                isExpanded
                  ? 'bg-primary text-white shadow-2xs rotate-180 hover:bg-primary/90'
                  : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
              }`}
              title={
                isExpanded
                  ? locale === 'ta'
                    ? 'சுருக்கு'
                    : 'Collapse'
                  : locale === 'ta'
                  ? 'விரி'
                  : 'Expand'
              }
            >
              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
            </button>
            <div className="flex flex-col items-start text-left min-w-0 flex-1 max-w-[calc(500px-2.5rem)]">
              <Tooltip>
                <TooltipTrigger
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(booth.id);
                  }}
                  className="cursor-pointer text-left focus:outline-none w-full max-w-full"
                >
                  <span className="font-bold text-xs sm:text-sm text-foreground underline decoration-dashed decoration-primary/30 underline-offset-4 hover:text-primary transition-colors break-words whitespace-normal leading-snug w-full block">
                    {booth.name
                      ? `${booth.boothNo} - ${booth.name}`
                      : booth.boothNo}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[350px] whitespace-normal">
                  <p className="font-semibold text-sm mb-1">{booth.name}</p>
                </TooltipContent>
              </Tooltip>
              {booth.panchayatRel && (
                <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-primary font-medium break-words whitespace-normal">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>
                    {locale === 'ta' && booth.panchayatRel.nameTa
                      ? booth.panchayatRel.nameTa
                      : booth.panchayatRel.name}
                  </span>
                </span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="font-medium py-4 w-[14%] min-w-[110px]">
          <div className="flex flex-wrap gap-1">
            {booth.kilais?.map((kilai: any, i: number) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200 max-w-full break-words"
              >
                {kilai.name}
              </span>
            ))}
          </div>
        </TableCell>
        <TableCell className="py-4 w-[16%] min-w-[120px]">
          <div className="flex flex-wrap gap-1">
            {agentsList.map((agent: any, index: number) => {
              const aName =
                locale === 'ta'
                  ? translatePersonNameToTamil(agent.name) || agent.name
                  : agent.name;
              return (
                <span
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAssignAgentsDialog(booth, currentElection);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 max-w-full truncate cursor-pointer hover:bg-primary/20 hover:scale-105 transition-all"
                  title={
                    agent.blaFormUrl
                      ? `${aName} (BLA Form attached)`
                      : `${aName} (Click to manage)`
                  }
                >
                  <span className="truncate">{aName}</span>
                  {agent.blaFormUrl && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewImage(agent.blaFormUrl);
                      }}
                      className="hover:text-blue-600 transition-colors shrink-0"
                      title="Preview BLA Form"
                    >
                      <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </span>
                  )}
                </span>
              );
            })}
            {!agentsList.length && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAssignAgentsDialog(booth, currentElection);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary/80 hover:text-primary hover:underline"
                title="Assign agents for this election"
              >
                <Plus className="w-3 h-3" />
                <span>{t('noneAssigned')}</span>
              </button>
            )}
          </div>
        </TableCell>
        <TableCell className="text-center py-4 font-medium text-muted-foreground w-[12%] min-w-[100px] whitespace-nowrap text-xs sm:text-sm">
          <span className="text-blue-600 font-bold">{booth.maleCount || 0}</span> /{' '}
          <span className="text-pink-600 font-bold">{booth.femaleCount || 0}</span> /{' '}
          <span className="text-purple-600 font-bold">
            {booth.thirdGenderCount || 0}
          </span>
        </TableCell>
        <TableCell className="text-center font-bold text-foreground py-4 w-[8%] min-w-[70px] whitespace-nowrap text-xs sm:text-sm">
          {booth.totalCount || 0}
        </TableCell>
        <TableCell className="py-4 w-[16%] min-w-[130px] text-center">
          {(() => {
            if (!recentElection) {
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddElectionDialog(booth);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-primary/80 hover:text-primary hover:bg-primary/10 border border-dashed border-primary/30 transition-all cursor-pointer"
                  title="Add Election Result"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Result</span>
                </button>
              );
            }

            const isTVKLead =
              recentElection.winnerPartyName === 'TVK' ||
              recentElection.tvkVotes > (recentElection.topParty1Votes || 0);

            return (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditElectionDialog(booth, recentElection);
                }}
                className="inline-flex flex-col items-center justify-center group/res cursor-pointer hover:scale-105 transition-transform"
                title="Click to view/edit election result"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-sm text-[#8F0A1B] dark:text-red-400">
                    {recentElection.tvkVotes?.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-extrabold shadow-2xs border',
                      isTVKLead
                        ? 'bg-[#FFC72C]/25 text-[#8F0A1B] border-amber-400/50'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200'
                    )}
                  >
                    {recentElection.tvkPercentage}%
                  </span>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[130px] block mt-0.5 group-hover/res:text-primary transition-colors">
                  {recentElection.electionYear ? `${recentElection.electionYear}` : ''}{' '}
                  {recentElection.electionName
                    ? `• ${recentElection.electionName.replace(/\d{4}\s*/, '')}`
                    : ''}
                </span>
              </div>
            );
          })()}
        </TableCell>
        <TableCell className="text-right py-4 pr-3 w-[8%] min-w-[70px]">
          <div
            className="flex justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full"
              onClick={() => onOpenDialog(booth)}
              title={t('editBooth')}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
              onClick={() => onDelete(booth.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Inline Expanded Details Drawer */}
      {isExpanded && (
        <BoothInlineDrawer
          booth={booth}
          selectedElectionId={selectedElectionId}
          onSelectElectionId={onSelectElectionId}
          dbElections={dbElections}
          currentElection={currentElection}
          onOpenAssignAgentsDialog={onOpenAssignAgentsDialog}
          onOpenEditAgentDialog={onOpenEditAgentDialog}
          onRemoveBoothElectionAgent={onRemoveBoothElectionAgent}
          onOpenAddElectionDialog={onOpenAddElectionDialog}
          onOpenEditElectionDialog={onOpenEditElectionDialog}
          onDeleteElectionResult={onDeleteElectionResult}
          onPreviewImage={onPreviewImage}
          onCallCadre={onCallCadre}
          onCollapse={() => onToggleExpand(booth.id)}
        />
      )}
    </React.Fragment>
  );
});

export interface BoothsTableViewProps {
  booths: any[];
  isLoading: boolean;
  currentElection: any;
  expandedBoothIds: Record<string, boolean>;
  onToggleExpand: (boothId: string) => void;
  selectedElectionId?: string;
  onSelectElectionId: (electionId: string) => void;
  dbElections: any[];
  onOpenDialog: (booth: any) => void;
  onDelete: (boothId: string) => void;
  onOpenAssignAgentsDialog: (booth: any, election?: any) => void;
  onOpenEditAgentDialog: (booth: any, election: any, agent: any) => void;
  onRemoveBoothElectionAgent: (boothId: string, electionId: string, cadreId: string) => void;
  onOpenAddElectionDialog: (booth: any) => void;
  onOpenEditElectionDialog: (booth: any, result: any) => void;
  onDeleteElectionResult: (boothId: string, resultId: string) => void;
  onPreviewImage: (url: string) => void;
  onCallCadre: (cadre: { name: string; phone: string }) => void;
}

export function BoothsTableViewComponent({
  booths,
  isLoading,
  currentElection,
  expandedBoothIds,
  onToggleExpand,
  selectedElectionId,
  onSelectElectionId,
  dbElections,
  onOpenDialog,
  onDelete,
  onOpenAssignAgentsDialog,
  onOpenEditAgentDialog,
  onRemoveBoothElectionAgent,
  onOpenAddElectionDialog,
  onOpenEditElectionDialog,
  onDeleteElectionResult,
  onPreviewImage,
  onCallCadre,
}: BoothsTableViewProps) {
  const t = useTranslations('Booths');
  const tCommon = useTranslations('Common');

  return (
    <div className="rounded-lg border border-primary/20 bg-card shadow-sm overflow-hidden p-2 animate-in fade-in duration-300">
      <Table>
        <TableHeader className="bg-[#d7d4cf]">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[26%] min-w-[170px] max-w-[500px] font-semibold text-primary py-4 whitespace-normal">
              {t('boothHeader')}
            </TableHead>
            <TableHead className="w-[14%] min-w-[110px] font-semibold text-primary py-4">
              {t('linkedKilais')}
            </TableHead>
            <TableHead className="w-[16%] min-w-[120px] font-semibold text-primary py-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>{t('agentsCadres')}</span>
                {currentElection && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-bold"
                    title={`${currentElection.year} ${currentElection.name}`}
                  >
                    {currentElection.year}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead className="w-[12%] min-w-[100px] font-semibold text-primary py-4 text-center whitespace-nowrap">
              {t('mf3rd')}
            </TableHead>
            <TableHead className="w-[8%] min-w-[70px] font-semibold text-primary py-4 text-center whitespace-nowrap">
              {t('totalCount')}
            </TableHead>
            <TableHead className="w-[16%] min-w-[130px] font-semibold text-primary py-4 text-center whitespace-nowrap">
              {t('recentResult')}
            </TableHead>
            <TableHead className="w-[8%] min-w-[70px] font-semibold text-primary py-4 text-right pr-3">
              {tCommon('actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {t('loading')}
              </TableCell>
            </TableRow>
          ) : booths.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {t('noBooths')}
              </TableCell>
            </TableRow>
          ) : (
            booths.map((booth: any) => (
              <BoothTableRow
                key={booth.id}
                booth={booth}
                isExpanded={Boolean(expandedBoothIds[booth.id])}
                currentElection={currentElection}
                onToggleExpand={onToggleExpand}
                selectedElectionId={selectedElectionId}
                onSelectElectionId={onSelectElectionId}
                dbElections={dbElections}
                onOpenDialog={onOpenDialog}
                onDelete={onDelete}
                onOpenAssignAgentsDialog={onOpenAssignAgentsDialog}
                onOpenEditAgentDialog={onOpenEditAgentDialog}
                onRemoveBoothElectionAgent={onRemoveBoothElectionAgent}
                onOpenAddElectionDialog={onOpenAddElectionDialog}
                onOpenEditElectionDialog={onOpenEditElectionDialog}
                onDeleteElectionResult={onDeleteElectionResult}
                onPreviewImage={onPreviewImage}
                onCallCadre={onCallCadre}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export const BoothsTableView = React.memo(BoothsTableViewComponent);
