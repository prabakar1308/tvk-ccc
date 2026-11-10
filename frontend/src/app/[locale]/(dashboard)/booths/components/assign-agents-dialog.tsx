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
import { Label } from '@/components/ui/label';
import {
  Users,
  Vote,
  FileText,
  Eye,
  X,
  Upload,
  Loader2,
  Paperclip,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { MultiAutocomplete } from '@/components/ui/autocomplete';
import { cadreApi } from '@/services/api/cadres';
import { uploadApi } from '@/services/api/upload';
import { translatePersonNameToTamil } from '@/lib/name-translations';

export interface AssignAgentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booth: any;
  election: any;
  selectedCadres: any[];
  onSelectedCadresChange: (cadres: any[]) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  onPreviewImage: (url: string) => void;
}

export function AssignAgentsDialog({
  open,
  onOpenChange,
  booth,
  election,
  selectedCadres,
  onSelectedCadresChange,
  onSave,
  isPending,
  onPreviewImage,
}: AssignAgentsDialogProps) {
  const locale = useLocale();
  const t = useTranslations('Booths');
  const tCommon = useTranslations('Common');
  const [uploadingCadreId, setUploadingCadreId] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] w-[95vw] max-h-[90vh] overflow-y-auto !p-6 sm:!p-7 rounded-2xl shadow-2xl border border-primary/20 bg-background space-y-5">
        <DialogHeader className="space-y-3 pb-3 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                {locale === 'ta' ? 'வாக்குச்சாவடி முகவர்கள் நியமனம்' : 'Manage Booth Agents'}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary text-white">
                  #{booth?.boothNo}
                </span>
                <span className="text-xs font-medium text-muted-foreground truncate max-w-[280px]">
                  {booth?.name}
                </span>
              </div>
            </div>
          </div>

          {election && (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Vote className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-amber-950 dark:text-amber-200 truncate">
                  {election.year} - {election.name}
                </span>
              </div>
              {election.isCurrent && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FFC72C] text-[#8F0A1B] shrink-0 shadow-2xs">
                  Active Election
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        <form onSubmit={onSave} className="space-y-5 pt-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
                {t('boothAgents')}
              </Label>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {selectedCadres.length} selected
              </span>
            </div>

            <MultiAutocomplete
              value={selectedCadres}
              onChange={(val) => onSelectedCadresChange(val)}
              fetchOptions={async (search) => {
                return await cadreApi.getAll({ search, limit: '10' });
              }}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              placeholder={
                locale === 'ta'
                  ? 'முகவர்களைத் தேடித் தேர்ந்தெடுக்கவும் (குறைந்தது 3 எழுத்துக்கள்)...'
                  : 'Search and select cadres by name, phone or member ID...'
              }
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'ta'
                ? 'இத்தேர்தலுக்கு நியமிக்கப்பட வேண்டிய தொண்டர்களை மேலே தேடித் தேர்ந்தெடுக்கவும். தேர்ந்தெடுக்கப்பட்டவர்கள் இந்த வாக்குச்சாவடிக்கான முகவர்களாக பதிவு செய்யப்படுவார்கள்.'
                : 'Search and select TVK cadres above to assign them as booth agents for this specific election.'}
            </p>
          </div>

          {/* Show chips/list of selected cadres with phone & BLA upload & remove button */}
          {selectedCadres.length > 0 && (
            <div className="space-y-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-primary/10">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {locale === 'ta' ? 'நியமிக்கப்பட்ட முகவர்கள் பட்டியல்' : 'Assigned Cadres List'}
              </p>
              <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-56 overflow-y-auto pr-1">
                {selectedCadres.map((cadre: any, idx: number) => {
                  const cName =
                    locale === 'ta'
                      ? translatePersonNameToTamil(cadre.name) || cadre.name
                      : cadre.name;
                  const isUploading = uploadingCadreId === cadre.id;
                  return (
                    <div
                      key={cadre.id || idx}
                      className="py-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {cadre.name?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {cName}
                          </p>
                          {cadre.phone && (
                            <p className="text-[11px] font-mono text-muted-foreground">
                              {cadre.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* BLA Form Upload / Preview Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {cadre.blaFormUrl ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onPreviewImage(cadre.blaFormUrl)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                              title="View BLA Form"
                            >
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>BLA Form</span>
                              <Eye className="w-2.5 h-2.5 opacity-70" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onSelectedCadresChange(
                                  selectedCadres.map((c) =>
                                    c.id === cadre.id ? { ...c, blaFormUrl: null } : c
                                  )
                                )
                              }
                              className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 cursor-pointer"
                              title="Remove attached form"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploading}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setUploadingCadreId(cadre.id);
                                  const res = await uploadApi.uploadFile(file);
                                  onSelectedCadresChange(
                                    selectedCadres.map((c) =>
                                      c.id === cadre.id ? { ...c, blaFormUrl: res.url } : c
                                    )
                                  );
                                } catch (err: any) {
                                  alert(err.message || 'Failed to upload BLA form image');
                                } finally {
                                  setUploadingCadreId(null);
                                }
                              }}
                            />
                            {isUploading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Paperclip className="w-3 h-3" />
                            )}
                            <span>{isUploading ? t('uploadingForm') : t('attachBlaForm')}</span>
                          </label>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            onSelectedCadresChange(
                              selectedCadres.filter((c) => c.id !== cadre.id)
                            )
                          }
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove Cadre"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-primary/10 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-5 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6 text-xs rounded-xl shadow-sm cursor-pointer"
            >
              {isPending
                ? locale === 'ta'
                  ? 'சேமிக்கிறது...'
                  : 'Saving...'
                : locale === 'ta'
                ? 'முகவர்களைப் புதுப்பி'
                : 'Save Assignments'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

