'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pencil,
  Vote,
  CheckCircle2,
  FileText,
  Eye,
  Trash2,
  Loader2,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { uploadApi } from '@/services/api/upload';
import { translatePersonNameToTamil } from '@/lib/name-translations';

export interface EditAgentModalData {
  booth: any;
  election: any;
  agent: any;
  cadreId: string;
  role: string;
  blaFormUrl: string | null;
  notes: string;
}

export interface EditAgentDialogProps {
  data: EditAgentModalData | null;
  onClose: () => void;
  onSave: (data: {
    boothId: string;
    electionId: string;
    cadreId: string;
    role: string;
    blaFormUrl: string | null;
    notes: string;
  }) => Promise<void>;
  isPending: boolean;
  onPreviewImage: (url: string) => void;
}

export function EditAgentDialog({
  data,
  onClose,
  onSave,
  isPending,
  onPreviewImage,
}: EditAgentDialogProps) {
  const locale = useLocale();
  const t = useTranslations('Booths');
  const tCommon = useTranslations('Common');

  const [blaFormUrl, setBlaFormUrl] = useState<string | null>(data?.blaFormUrl ?? null);
  const [notes, setNotes] = useState<string>(data?.notes ?? '');
  const [isUploading, setIsUploading] = useState(false);

  // Sync state when data changes
  React.useEffect(() => {
    if (data) {
      setBlaFormUrl(data.blaFormUrl ?? null);
      setNotes(data.notes ?? '');
    }
  }, [data]);

  if (!data) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      boothId: data.booth.id,
      electionId: data.election.id,
      cadreId: data.cadreId,
      role: data.role || 'Booth Agent',
      blaFormUrl,
      notes,
    });
  };

  const agentName =
    locale === 'ta'
      ? translatePersonNameToTamil(data.agent?.name) || data.agent?.name
      : data.agent?.name;

  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto !p-6 rounded-2xl shadow-2xl border border-primary/20 bg-background space-y-4">
        <DialogHeader className="space-y-2 pb-3 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Pencil className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
                {t('editBoothAgent')}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary text-white">
                  #{data.booth?.boothNo}
                </span>
                <span className="text-xs font-medium text-muted-foreground truncate max-w-[260px]">
                  {data.booth?.name}
                </span>
              </div>
            </div>
          </div>

          {data.election && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <Vote className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {data.election.year} - {data.election.name}
              </span>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Agent Details Card */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-primary/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-800 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
              {data.agent?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{agentName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                {data.agent?.phone && <span>{data.agent.phone}</span>}
                {data.agent?.memberId && <span>• ID: {data.agent.memberId}</span>}
              </div>
            </div>
          </div>

          {/* BLA Form Upload / Preview Section */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 flex items-center justify-between">
              <span>{t('blaForm')}</span>
              {blaFormUrl && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Attached
                </span>
              )}
            </Label>

            {blaFormUrl ? (
              <div className="p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div
                    onClick={() => onPreviewImage(blaFormUrl)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                      <img src={blaFormUrl} alt="BLA Form" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1 truncate">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>BLA Form / படிவம்</span>
                      </p>
                      <p className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                        <Eye className="w-3 h-3" />
                        <span>Click to preview</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setIsUploading(true);
                            const res = await uploadApi.uploadFile(file);
                            setBlaFormUrl(res.url);
                          } catch (err: any) {
                            alert(err.message || 'Failed to upload image');
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                      />
                      {isUploading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Paperclip className="w-3 h-3" />
                      )}
                      <span>{t('changeBlaForm')}</span>
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBlaFormUrl(null)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                      title="Remove attached BLA form"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-center">
                <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setIsUploading(true);
                        const res = await uploadApi.uploadFile(file);
                        setBlaFormUrl(res.url);
                      } catch (err: any) {
                        alert(err.message || 'Failed to upload image');
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-primary hover:underline">
                    {isUploading ? t('uploadingForm') : t('attachBlaForm')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {locale === 'ta'
                      ? 'PNG, JPG அல்லது JPEG படிவப் படம்'
                      : 'Attach signed BLA appointment form photo'}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              {t('agentNotes')}
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                locale === 'ta'
                  ? 'முகவர் பற்றிய குறிப்புகள் (தேவைப்பட்டால்)...'
                  : 'Optional notes (shift, timings, remarks)...'
              }
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-primary/10 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isPending || isUploading}
              className="bg-primary hover:bg-primary/90 text-white font-bold h-9 px-5 text-xs rounded-xl shadow-sm cursor-pointer"
            >
              {isPending
                ? locale === 'ta'
                  ? 'சேமிக்கிறது...'
                  : 'Saving...'
                : locale === 'ta'
                ? 'சேமி'
                : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

