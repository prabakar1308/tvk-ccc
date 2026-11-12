'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, BarChart3 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  BoothElectionResult,
  CreateBoothElectionResultDto,
} from '@/services/api/booths';
import { ElectionSelect } from '@/components/shared/election-select';

export interface ElectionResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booth: any;
  editingResult: BoothElectionResult | null;
  formData: CreateBoothElectionResultDto;
  onFormDataChange: React.Dispatch<React.SetStateAction<CreateBoothElectionResultDto>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  dbElections: any[];
}

export function ElectionResultDialog({
  open,
  onOpenChange,
  booth,
  editingResult,
  formData,
  onFormDataChange,
  onSubmit,
  isPending,
  dbElections,
}: ElectionResultDialogProps) {
  const locale = useLocale();
  const t = useTranslations('Booths');
  const [isCustomYear, setIsCustomYear] = React.useState(false);

  // Active / current master election
  const activeMasterElection = React.useMemo(() => {
    return (
      dbElections.find((e: any) => e.isCurrent) ||
      (dbElections.length > 0 ? dbElections[0] : null)
    );
  }, [dbElections]);

  // Match existing formData against dbElections
  const matchedMasterElection = React.useMemo(() => {
    if (!formData.electionYear) return null;
    return (
      dbElections.find(
        (e: any) =>
          e.year === formData.electionYear &&
          (!formData.electionName || e.name === formData.electionName || e.nameTa === formData.electionName)
      ) ||
      dbElections.find((e: any) => e.year === formData.electionYear) ||
      null
    );
  }, [dbElections, formData.electionYear, formData.electionName]);

  // Determine current value for ElectionSelect - defaults to active election if not custom or editing
  const selectedElectionValue = React.useMemo(() => {
    if (isCustomYear) return 'Other';
    if (matchedMasterElection) return matchedMasterElection.id;
    if (editingResult && formData.electionYear) return 'Other';
    // Default to the active master election
    return activeMasterElection?.id || '';
  }, [isCustomYear, matchedMasterElection, editingResult, formData.electionYear, activeMasterElection]);

  // Sync active election to formData when opening to add a new result
  React.useEffect(() => {
    if (open && !editingResult && activeMasterElection) {
      if (!formData.electionYear || (!matchedMasterElection && !isCustomYear)) {
        setIsCustomYear(false);
        onFormDataChange((prev) => ({
          ...prev,
          electionYear: activeMasterElection.year,
          electionName:
            locale === 'ta' && activeMasterElection.nameTa
              ? activeMasterElection.nameTa
              : activeMasterElection.name,
        }));
      }
    } else if (open && editingResult) {
      if (formData.electionYear && !matchedMasterElection) {
        setIsCustomYear(true);
      } else {
        setIsCustomYear(false);
      }
    }
  }, [open, editingResult, activeMasterElection, matchedMasterElection, isCustomYear, formData.electionYear, locale, onFormDataChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {editingResult ? t('editElectionResult') : t('addElectionResult')}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Booth #{booth?.boothNo} - {booth?.name}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          {/* Election Selection */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('forElection') || 'Election'} *</Label>
                <ElectionSelect
                  value={selectedElectionValue}
                  elections={dbElections}
                  allowCustom
                  autoSelectActive
                  customLabel={locale === 'ta' ? 'பிற / தனிப்பயன் தேர்தல்' : 'Other / Custom Election'}
                  onSelectElection={(elec) => {
                    if (elec) {
                      setIsCustomYear(false);
                      onFormDataChange((prev) => ({
                        ...prev,
                        electionYear: elec.year,
                        electionName:
                          locale === 'ta' && elec.nameTa ? elec.nameTa : elec.name,
                      }));
                    }
                  }}
                  onValueChange={(val) => {
                    if (val === 'Other') {
                      setIsCustomYear(true);
                    } else {
                      setIsCustomYear(false);
                    }
                  }}
                  size="default"
                  className="w-full h-10 rounded-xl bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('electionName')} *</Label>
                <Input
                  value={formData.electionName}
                  onChange={(e) =>
                    onFormDataChange((prev) => ({ ...prev, electionName: e.target.value }))
                  }
                  placeholder="e.g. 2024 Parliamentary Election"
                  required
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            {/* Custom Election Year Input (if 'Other / Custom Election' is chosen) */}
            {isCustomYear && (
              <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 animate-in fade-in slide-in-from-top-1">
                <Label className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {t('electionYear')} ({locale === 'ta' ? 'தனிப்பயன் ஆண்டு' : 'Custom Year'}) *
                </Label>
                <Input
                  value={formData.electionYear}
                  onChange={(e) =>
                    onFormDataChange((prev) => ({ ...prev, electionYear: e.target.value }))
                  }
                  placeholder="e.g. 2014, 2011, 2006"
                  required
                  className="h-10 rounded-xl font-mono bg-background"
                />
              </div>
            )}
          </div>

          {/* Votes Polled & TVK Votes Highlight */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('totalVotesPolled')} *</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.totalVotesPolled || ''}
                  onChange={(e) =>
                    onFormDataChange((prev) => ({
                      ...prev,
                      totalVotesPolled: Number(e.target.value),
                    }))
                  }
                  placeholder="e.g. 1250"
                  required
                  className="h-10 rounded-xl bg-white dark:bg-zinc-800 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#8F0A1B] dark:text-red-400">
                  {t('tvkVotes')} *
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.tvkVotes || ''}
                  onChange={(e) =>
                    onFormDataChange((prev) => ({ ...prev, tvkVotes: Number(e.target.value) }))
                  }
                  placeholder="e.g. 450"
                  required
                  className="h-10 rounded-xl bg-white dark:bg-zinc-800 font-black text-[#8F0A1B]"
                />
              </div>
            </div>

            {/* Live Vote Share Calculation Preview */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border border-primary/20">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                <span>{t('tvkVoteShare')} (Live Preview):</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-[#FFC72C] text-black shadow-2xs">
                {formData.totalVotesPolled > 0
                  ? `${Math.round(((formData.tvkVotes || 0) / formData.totalVotesPolled) * 10000) / 100}%`
                  : '0%'}
              </span>
            </div>
          </div>

          {/* Top 2 Competing Parties */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('topCompetingParties')}
            </Label>

            {/* Competitor 1 */}
            <div className="p-3 rounded-xl bg-muted/30 border border-primary/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  {t('party1')} Name
                </Label>
                <Input
                  value={formData.topParty1Name || ''}
                  onChange={(e) =>
                    onFormDataChange((prev) => ({ ...prev, topParty1Name: e.target.value }))
                  }
                  placeholder="e.g. DMK"
                  className="h-9 rounded-lg bg-white dark:bg-zinc-800 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  {t('party1')} Votes
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.topParty1Votes || ''}
                  onChange={(e) =>
                    onFormDataChange((prev) => ({
                      ...prev,
                      topParty1Votes: Number(e.target.value),
                    }))
                  }
                  placeholder="e.g. 520"
                  className="h-9 rounded-lg bg-white dark:bg-zinc-800 text-xs font-bold"
                />
              </div>
            </div>

            {/* Competitor 2 */}
            <div className="p-3 rounded-xl bg-muted/30 border border-primary/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  {t('party2')} Name
                </Label>
                <Input
                  value={formData.topParty2Name || ''}
                  onChange={(e) =>
                    onFormDataChange((prev) => ({ ...prev, topParty2Name: e.target.value }))
                  }
                  placeholder="e.g. AIADMK"
                  className="h-9 rounded-lg bg-white dark:bg-zinc-800 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  {t('party2')} Votes
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.topParty2Votes || ''}
                  onChange={(e) =>
                    onFormDataChange((prev) => ({
                      ...prev,
                      topParty2Votes: Number(e.target.value),
                    }))
                  }
                  placeholder="e.g. 340"
                  className="h-9 rounded-lg bg-white dark:bg-zinc-800 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Notes / Remarks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Notes / Observations</Label>
            <Input
              value={formData.notes || ''}
              onChange={(e) => onFormDataChange((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. High youth voter participation, key local issues..."
              className="h-9 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 px-4 cursor-pointer"
            >
              {t('close')}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-10 px-6 shadow-md cursor-pointer"
            >
              {editingResult ? 'Update Result' : 'Save Result'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

