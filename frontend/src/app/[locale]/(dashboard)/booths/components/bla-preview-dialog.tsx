'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export interface BlaPreviewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function BlaPreviewDialog({ imageUrl, onClose }: BlaPreviewDialogProps) {
  const locale = useLocale();
  const tCommon = useTranslations('Common');

  // Keep a cached copy of the image URL so it stays visible during exit transition
  const [cachedUrl, setCachedUrl] = React.useState<string | null>(imageUrl);

  React.useEffect(() => {
    if (imageUrl) {
      setCachedUrl(imageUrl);
    }
  }, [imageUrl]);

  const activeUrl = imageUrl || cachedUrl;

  return (
    <Dialog open={Boolean(imageUrl)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[720px] w-[95vw] max-h-[92vh] overflow-y-auto !p-5 rounded-2xl shadow-2xl border border-primary/20 bg-background space-y-4">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-primary/10">
          <DialogTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>
              {locale === 'ta'
                ? 'வாக்குச்சாவடி முகவர் நியமனப் படிவம் (BLA Form)'
                : 'Booth Level Agent (BLA) Form'}
            </span>
          </DialogTitle>
          {activeUrl && (
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline px-2.5 py-2 mr-4 rounded-lg bg-primary/10 border border-primary/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{locale === 'ta' ? 'முழு அளவில் காண்க' : 'Open Full Image'}</span>
            </a>
          )}
        </DialogHeader>

        <div className="py-2 flex justify-center items-center bg-zinc-950/5 dark:bg-zinc-900/60 rounded-xl overflow-hidden min-h-[320px] max-h-[68vh] border border-gray-200/60 dark:border-zinc-800">
          {activeUrl && (
            <img
              src={activeUrl}
              alt="BLA Form"
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
            />
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold px-5 cursor-pointer"
          >
            {tCommon('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

