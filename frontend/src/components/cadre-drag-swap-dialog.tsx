'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ArrowLeftRight, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { formatDesignation } from '@/components/cadre-card';
import { translatePersonNameToTamil } from '@/lib/name-translations';

export interface CadreDragSwapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cadreA: any | null;
  cadreB: any | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function CadreDragSwapDialog({
  isOpen,
  onClose,
  cadreA,
  cadreB,
  onConfirm,
  isLoading = false,
}: CadreDragSwapDialogProps) {
  const locale = useLocale();

  if (!cadreA || !cadreB) return null;

  const roleA = cadreA.officeBearerRoles?.[0]?.role || cadreA.role || 'Member';
  const roleB = cadreB.officeBearerRoles?.[0]?.role || cadreB.role || 'Member';

  const desigA = formatDesignation(roleA, locale);
  const desigB = formatDesignation(roleB, locale);

  const nameA = locale === 'ta' && cadreA.name ? translatePersonNameToTamil(cadreA.name) : cadreA.name;
  const nameB = locale === 'ta' && cadreB.name ? translatePersonNameToTamil(cadreB.name) : cadreB.name;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 overflow-hidden">
        <DialogHeader className="space-y-2 text-left">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-1">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-heading font-black text-zinc-900 dark:text-zinc-100">
            {locale === 'ta' ? 'பதவிகளை மாற்ற உறுதிப்படுத்தவும்' : 'Confirm Role Swap'}
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            {locale === 'ta'
              ? 'இரு நிர்வாகிகளின் பதவிகளையும் ஒன்றுக்கொன்று மாற்ற விரும்புகிறீர்களா?'
              : 'Are you sure you want to swap the designated roles between these two cadres?'}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          {/* Cadre A Swap Summary */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar name={cadreA.name} src={cadreA.photoUrl} size="md" className="shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{nameA}</p>
                <p className="text-xs text-zinc-500 truncate">{cadreA.phone || cadreA.memberId || ''}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block text-[11px] font-medium text-zinc-400 line-through mr-1.5">
                {desigA}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300/60">
                <ArrowRight className="w-3 h-3" />
                {desigB}
              </span>
            </div>
          </div>

          {/* Swap Divider Icon */}
          <div className="flex items-center justify-center -my-1 text-zinc-400">
            <ArrowLeftRight className="w-4 h-4" />
          </div>

          {/* Cadre B Swap Summary */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar name={cadreB.name} src={cadreB.photoUrl} size="md" className="shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{nameB}</p>
                <p className="text-xs text-zinc-500 truncate">{cadreB.phone || cadreB.memberId || ''}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block text-[11px] font-medium text-zinc-400 line-through mr-1.5">
                {desigB}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300/60">
                <ArrowRight className="w-3 h-3" />
                {desigA}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl font-semibold border-zinc-200 dark:border-zinc-800"
          >
            {locale === 'ta' ? 'ரத்துசெய்' : 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl font-bold bg-[#8F0A1B] hover:bg-[#730715] text-white shadow-md shadow-[#8F0A1B]/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {locale === 'ta' ? 'மாற்றப்படுகிறது...' : 'Swapping...'}
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                {locale === 'ta' ? 'பதவிகளை மாற்று' : 'Confirm Swap'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
