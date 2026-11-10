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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trophy, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  BoothElectionResult,
  CreateBoothElectionResultDto,
} from '@/services/api/booths';

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
  const t = useTranslations('Booths');

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{t('electionYear')} *</Label>
              <Select
                value={formData.electionYear || '2024'}
                onValueChange={(val) => {
                  const yearStr = val || '2024';
                  const matchedElec = dbElections.find((e: any) => e.year === yearStr);
                  const defaultName = matchedElec
                    ? matchedElec.name
                    : yearStr === '2026'
                    ? '2026 Assembly Election'
                    : yearStr === '2024'
                    ? '2024 Parliamentary Election'
                    : yearStr === '2021'
                    ? '2021 Assembly Election'
                    : yearStr === '2019'
                    ? '2019 Parliamentary Election'
                    : yearStr === '2016'
                    ? '2016 Assembly Election'
                    : `${yearStr} Election`;
                  onFormDataChange((prev) => ({
                    ...prev,
                    electionYear: yearStr,
                    electionName: defaultName,
                  }));
                }}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {dbElections.length > 0 ? (
                    dbElections.map((elec: any) => (
                      <SelectItem key={elec.id} value={elec.year}>
                        {elec.year} - {elec.name} {elec.isCurrent ? '★ (Active)' : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="2026">2026 Assembly Election</SelectItem>
                      <SelectItem value="2024">2024 Parliamentary Election</SelectItem>
                      <SelectItem value="2021">2021 Assembly Election</SelectItem>
                      <SelectItem value="2019">2019 Parliamentary Election</SelectItem>
                      <SelectItem value="2016">2016 Assembly Election</SelectItem>
                    </>
                  )}
                  <SelectItem value="Other">Other / Custom Year</SelectItem>
                </SelectContent>
              </Select>
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

