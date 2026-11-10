'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Building2,
  Users,
  MapPin,
  Trophy,
  Plus,
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { shortenBoothName } from '@/lib/booth-utils';
import { getOrgUnitName } from '@/lib/org-unit-translations';

export interface BoothsGridViewProps {
  booths: any[];
  isLoading: boolean;
  currentElection: any;
  onOpenDialog: (booth: any) => void;
  onDelete: (boothId: string) => void;
  onOpenAssignAgentsDialog: (booth: any, election?: any) => void;
  onOpenAddElectionDialog: (booth: any) => void;
  onOpenEditElectionDialog: (booth: any, result: any) => void;
  onPreviewImage: (url: string) => void;
  onSelectBooth: (booth: any) => void;
}

export function BoothsGridViewComponent({
  booths,
  isLoading,
  currentElection,
  onOpenDialog,
  onDelete,
  onOpenAssignAgentsDialog,
  onOpenAddElectionDialog,
  onOpenEditElectionDialog,
  onPreviewImage,
  onSelectBooth,
}: BoothsGridViewProps) {
  const locale = useLocale();
  const t = useTranslations('Booths');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
      {isLoading ? (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          {t('loading')}
        </div>
      ) : booths.length === 0 ? (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          {t('noBooths')}
        </div>
      ) : (
        booths.map((booth: any) => (
          <Card
            key={booth.id}
            className="p-1 gap-1 overflow-hidden border-2 border-primary/20 dark:border-primary/30 shadow-md hover:border-primary/50 hover:shadow-xl transition-all duration-300 group bg-card relative rounded-xl"
          >
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-full p-0.5 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary hover:bg-primary/20 rounded-full"
                onClick={() => onOpenDialog(booth)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/20 rounded-full"
                onClick={() => onDelete(booth.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="bg-[#eae8d3] p-4 border-b border-primary/10">
              <div className="pr-14">
                <h3
                  className="font-bold text-lg text-primary mb-0.5 truncate"
                  title={booth.boothNo}
                >
                  {booth.boothNo}
                </h3>
                <Tooltip>
                  <TooltipTrigger onClick={() => onSelectBooth(booth)} className="text-left w-full">
                    <p className="text-sm font-semibold text-foreground leading-snug break-words underline decoration-dashed decoration-primary/30 underline-offset-4 hover:text-primary transition-colors">
                      {booth.name ? shortenBoothName(booth.name) : t('noAreaSpecified')}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[350px] whitespace-normal z-50">
                    <p className="font-semibold text-sm mb-1">{booth.name}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {booth.panchayatRel && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary">
                      <MapPin className="w-3 h-3" />
                      {locale === 'ta' && booth.panchayatRel.nameTa
                        ? booth.panchayatRel.nameTa
                        : booth.panchayatRel.name}
                    </span>
                  )}
                  {booth.union && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                      {getOrgUnitName(booth.union, locale)}
                    </span>
                  )}
                </div>

                {/* Recent Election Badge in Tile Header */}
                {(() => {
                  const tileRecent =
                    booth.electionResults && booth.electionResults.length > 0
                      ? booth.electionResults[0]
                      : null;
                  if (!tileRecent) {
                    return (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAddElectionDialog(booth);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-primary/80 hover:text-primary bg-white/70 hover:bg-white border border-dashed border-primary/30 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>
                            {locale === 'ta' ? 'தேர்தல் முடிவு சேர்க்க' : 'Add Election Result'}
                          </span>
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditElectionDialog(booth, tileRecent);
                      }}
                      className="inline-flex items-center gap-1.5 mt-2.5 px-2 py-0.5 rounded-md bg-[#FFC72C]/30 hover:bg-[#FFC72C]/50 border border-amber-400/40 text-[11px] font-bold cursor-pointer transition-colors"
                      title="Click to view/edit result"
                    >
                      <Trophy className="w-3 h-3 text-[#8F0A1B]" />
                      <span className="text-[#8F0A1B] font-black">
                        TVK: {tileRecent.tvkVotes?.toLocaleString()} ({tileRecent.tvkPercentage}%)
                      </span>
                      <span className="text-[10px] font-normal text-muted-foreground">
                        • {tileRecent.electionYear}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <CardContent className="p-5 space-y-5">
              <div className="space-y-4">
                {booth.villages && booth.villages.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />{' '}
                      {locale === 'ta' ? 'வாக்குச்சாவடிக்குட்பட்ட பகுதிகள்' : 'Villages Covered'}
                    </p>
                    <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
                      {booth.villages.map((v: any) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40"
                        >
                          {locale === 'ta' && v.nameTa ? v.nameTa : v.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> {t('linkedKilais')}
                  </p>
                  <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
                    {booth.kilais?.map((kilai: any, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                      >
                        {kilai.name}
                      </span>
                    ))}
                    {!booth.kilais?.length && (
                      <span className="text-xs text-muted-foreground italic">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> {t('agentsCadres')}
                      {currentElection && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                          {currentElection.year}
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenAssignAgentsDialog(booth, currentElection)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{locale === 'ta' ? 'நிர்வாகி' : 'Assign'}</span>
                    </button>
                  </div>
                  {(() => {
                    const tileAgents =
                      booth.latestAgents && booth.latestAgents.length > 0
                        ? booth.latestAgents
                        : booth.agents || [];
                    return (
                      <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
                        {tileAgents.map((agent: any, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"
                          >
                            <span>{agent.name}</span>
                            {agent.blaFormUrl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreviewImage(agent.blaFormUrl);
                                }}
                                className="hover:text-blue-600 transition-colors shrink-0"
                                title="View BLA Form"
                              >
                                <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              </button>
                            )}
                          </span>
                        ))}
                        {!tileAgents.length && (
                          <button
                            type="button"
                            onClick={() => onOpenAssignAgentsDialog(booth, currentElection)}
                            className="text-xs text-rose-500 font-medium italic bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 transition-colors"
                          >
                            {t('noneAssigned')}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Past Election Results Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" /> {t('pastElectionResults')}
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenAddElectionDialog(booth)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{locale === 'ta' ? 'சேர்' : 'Add'}</span>
                    </button>
                  </div>
                  {booth.electionResults && booth.electionResults.length > 0 ? (
                    <div className="space-y-1.5">
                      {booth.electionResults.slice(0, 2).map((res: any) => (
                        <div
                          key={res.id}
                          onClick={() => onOpenEditElectionDialog(booth, res)}
                          className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-gray-200/70 dark:border-zinc-700 flex items-center justify-between text-xs cursor-pointer hover:border-primary/40 transition-colors"
                        >
                          <span className="font-semibold text-gray-800 dark:text-zinc-200 truncate pr-2">
                            {res.electionYear} {res.electionName}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 font-mono">
                            <span className="font-bold text-[#8F0A1B]">
                              {res.tvkVotes?.toLocaleString()}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-[#8F0A1B] font-extrabold text-[10px]">
                              {res.tvkPercentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                      {booth.electionResults.length > 2 && (
                        <p className="text-[10px] text-muted-foreground text-center italic">
                          +{booth.electionResults.length - 2} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {t('noElectionResults')}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/5 bg-zinc-50/50 dark:bg-zinc-900/50 -mx-5 px-5 -mb-5 pb-5 rounded-b-xl">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground tracking-wide mb-1">
                    {t('mf3rd')}
                  </p>
                  <p className="font-semibold text-sm">
                    <span className="text-blue-600 dark:text-blue-400" title="Male">
                      {booth.maleCount || 0}
                    </span>
                    <span className="text-muted-foreground/30 mx-1">/</span>
                    <span className="text-pink-600 dark:text-pink-400" title="Female">
                      {booth.femaleCount || 0}
                    </span>
                    <span className="text-muted-foreground/30 mx-1">/</span>
                    <span className="text-purple-600 dark:text-purple-400" title="Third Gender">
                      {booth.thirdGenderCount || 0}
                    </span>
                  </p>
                </div>
                <div className="text-right border-l border-primary/10 pl-4">
                  <p className="text-[11px] font-bold text-muted-foreground tracking-wide mb-1">
                    {t('totalCount')}
                  </p>
                  <p className="font-black text-xl text-primary">{booth.totalCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export const BoothsGridView = React.memo(BoothsGridViewComponent);

