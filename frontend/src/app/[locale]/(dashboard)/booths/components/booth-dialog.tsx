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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, MapPin, Check, Trophy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { MultiAutocomplete } from '@/components/ui/autocomplete';
import { MultiSelectDropdown } from './multi-select-dropdown';
import { cadreApi } from '@/services/api/cadres';
import { getOrgUnitName } from '@/lib/org-unit-translations';
import { cn } from '@/lib/utils';

export interface BoothFormState {
  name: string;
  boothNo: string;
  area: string;
  unionId: string;
  panchayatId: string;
  villageIds: string[];
  maleCount: number;
  femaleCount: number;
  thirdGenderCount: number;
  totalCount: number;
  kilaiIds: string[];
  agentIds: string[];
  agents: any[];
}

export interface BoothDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBooth: any | null;
  formData: BoothFormState;
  setFormData: React.Dispatch<React.SetStateAction<BoothFormState>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  unions?: any[];
  unionPanchayats: any[] | undefined;
  panchayatVillages: any[] | undefined;
  kilais: any[] | undefined;
}

export function BoothDialog({
  open,
  onOpenChange,
  editingBooth,
  formData,
  setFormData,
  onSubmit,
  isPending,
  unions,
  unionPanchayats,
  panchayatVillages,
  kilais,
}: BoothDialogProps) {
  const locale = useLocale();
  const t = useTranslations('Booths');
  const tCommon = useTranslations('Common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingBooth ? t('editBooth') : t('addNewBooth')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="boothNo">{t('boothNumber')} *</Label>
              <Input
                id="boothNo"
                value={formData.boothNo}
                onChange={(e) => setFormData({ ...formData, boothNo: e.target.value })}
                required
                placeholder={t('egB101')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">{t('area')}</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder={t('egNorthZone')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t('boothName')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder={t('egGovtSchool')}
            />
          </div>

          {/* Administrative Hierarchy Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="boothUnion">
                {locale === 'ta'
                  ? 'அமைப்பு அலகு (ஒன்றியம் / நகரம்)'
                  : 'Org Unit (Union / Town)'}
              </Label>
              <Select
                value={formData.unionId || '__NONE__'}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    unionId: !val || val === '__NONE__' ? '' : val,
                    panchayatId: '',
                    villageIds: [],
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      locale === 'ta'
                        ? 'அமைப்பு அலகைத் தேர்ந்தெடுக்கவும்'
                        : 'Select Org Unit'
                    }
                  >
                    {formData.unionId && formData.unionId !== '__NONE__'
                      ? getOrgUnitName(
                          unions?.find((u: any) => String(u.id || u._id) === formData.unionId),
                          locale
                        )
                      : locale === 'ta'
                      ? 'அமைப்பு அலகு இல்லை / தேர்ந்தெடுக்கப்படவில்லை'
                      : 'None (Unassigned)'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">
                    {locale === 'ta'
                      ? 'அமைப்பு அலகு இல்லை / தேர்ந்தெடுக்கப்படவில்லை'
                      : 'None (Unassigned)'}
                  </SelectItem>
                  {unions?.map((u: any) => (
                    <SelectItem key={u.id || u._id} value={String(u.id || u._id)}>
                      {getOrgUnitName(u, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="boothPanchayat">
                {locale === 'ta' ? 'ஊராட்சி / வார்டு' : 'Panchayat / Ward'}
              </Label>
              <Select
                value={formData.panchayatId || '__NONE__'}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    panchayatId: !val || val === '__NONE__' ? '' : val,
                    villageIds: [],
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      locale === 'ta' ? 'ஊராட்சியைத் தேர்ந்தெடுக்கவும்' : 'Select Panchayat / Ward'
                    }
                  >
                    {formData.panchayatId && formData.panchayatId !== '__NONE__'
                      ? (() => {
                          const p = unionPanchayats?.find((p) => p.id === formData.panchayatId);
                          return p
                            ? locale === 'ta' && p.nameTa
                              ? `${p.nameTa} (${p.name})`
                              : p.name
                            : formData.panchayatId;
                        })()
                      : locale === 'ta'
                      ? 'ஊராட்சி இல்லை / தேர்ந்தெடுக்கப்படவில்லை'
                      : 'None (Unassigned)'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">
                    {locale === 'ta'
                      ? 'ஊராட்சி இல்லை / தேர்ந்தெடுக்கப்படவில்லை'
                      : 'None (Unassigned)'}
                  </SelectItem>
                  {unionPanchayats?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {locale === 'ta' && p.nameTa ? `${p.nameTa} (${p.name})` : p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Villages / Hamlets Covered on Electoral Roll */}
          {formData.panchayatId && panchayatVillages && panchayatVillages.length > 0 && (
            <div className="space-y-2">
              <Label>
                {locale === 'ta'
                  ? 'வாக்குச்சாவடிக்குட்பட்ட கிராமங்கள் / குடியிருப்புகள்'
                  : 'Villages / Hamlets Covered (Voter Roll)'}
              </Label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-muted/20">
                {panchayatVillages.map((v) => {
                  const isSelected = formData.villageIds?.includes(v.id);
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => {
                        const curr = formData.villageIds || [];
                        setFormData({
                          ...formData,
                          villageIds: isSelected
                            ? curr.filter((id) => id !== v.id)
                            : [...curr, v.id],
                        });
                      }}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1',
                        isSelected
                          ? 'bg-primary text-white border-primary font-semibold'
                          : 'bg-background hover:bg-muted text-foreground border-border'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {locale === 'ta' && v.nameTa ? v.nameTa : v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('linkedKilais')}</Label>
            <MultiSelectDropdown
              options={kilais || []}
              selected={formData.kilaiIds}
              onChange={(val) => setFormData({ ...formData, kilaiIds: val })}
              placeholder="Select kilais..."
            />
          </div>

          <div className="space-y-2">
            <Label>{t('boothAgents')}</Label>
            <MultiAutocomplete
              value={formData.agents}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  agents: val,
                  agentIds: val.map((v: any) => v.id),
                })
              }
              fetchOptions={async (search) => {
                return await cadreApi.getAll({ search, limit: '10' });
              }}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              placeholder="Search agents (min 3 chars)..."
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maleCount">{t('male')}</Label>
              <Input
                id="maleCount"
                type="number"
                min="0"
                value={formData.maleCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    maleCount: val,
                    totalCount: val + formData.femaleCount + formData.thirdGenderCount,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="femaleCount">{t('female')}</Label>
              <Input
                id="femaleCount"
                type="number"
                min="0"
                value={formData.femaleCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    femaleCount: val,
                    totalCount: formData.maleCount + val + formData.thirdGenderCount,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thirdGenderCount">{t('thirdGender')}</Label>
              <Input
                id="thirdGenderCount"
                type="number"
                min="0"
                value={formData.thirdGenderCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    thirdGenderCount: val,
                    totalCount: formData.maleCount + formData.femaleCount + val,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalCount">{t('total')}</Label>
              <Input
                id="totalCount"
                type="number"
                min="0"
                value={formData.totalCount}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-primary text-white"
              disabled={isPending}
            >
              {editingBooth ? t('updateBooth') : t('saveBooth')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface ViewBoothDialogProps {
  booth: any | null;
  onClose: () => void;
}

export function ViewBoothDialog({ booth, onClose }: ViewBoothDialogProps) {
  const locale = useLocale();
  const t = useTranslations('Booths');

  const [cachedBooth, setCachedBooth] = React.useState<any | null>(booth);

  React.useEffect(() => {
    if (booth) setCachedBooth(booth);
  }, [booth]);

  const activeBooth = booth || cachedBooth;

  return (
    <Dialog open={Boolean(booth)} onOpenChange={(open) => !open && onClose()}>
      {activeBooth && (
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-full overflow-x-hidden overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl text-primary break-all pr-8 leading-tight">
              {activeBooth.name}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-muted-foreground font-semibold">
                {t('boothHeader')} {activeBooth.boothNo}
              </span>
            {activeBooth.panchayatRel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                <MapPin className="w-3 h-3" />
                {locale === 'ta' && activeBooth.panchayatRel.nameTa
                  ? activeBooth.panchayatRel.nameTa
                  : activeBooth.panchayatRel.name}
              </span>
            )}
            {activeBooth.union && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
                <Building2 className="w-3 h-3" />
                {getOrgUnitName(activeBooth.union, locale)}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Linked Villages & Hamlets Covered on Electoral Roll */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground/80 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              {locale === 'ta'
                ? 'வாக்குச்சாவடிக்குட்பட்ட கிராமங்கள் / குடியிருப்புகள்'
                : 'Villages / Hamlets Covered'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeBooth.villages?.length ? (
                activeBooth.villages.map((v: any) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200"
                  >
                    {locale === 'ta' && v.nameTa ? v.nameTa : v.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic bg-muted px-2.5 py-1 rounded-md">
                  {locale === 'ta'
                    ? 'குறிப்பிட்ட கிராமங்கள் எதுவும் இணைக்கப்படவில்லை'
                    : 'No specific villages recorded'}
                </span>
              )}
            </div>
          </div>

          {/* Linked Kilais */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground/80">
              {t('linkedKilais')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeBooth.kilais?.length ? (
                activeBooth.kilais.map((k: any) => (
                  <span
                    key={k.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800 border border-green-200 max-w-full break-words whitespace-normal text-left"
                  >
                    {k.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic bg-muted px-3 py-1 rounded-md">
                  {t('noKilaisLinked')}
                </span>
              )}
            </div>
          </div>

          {/* Agents */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground/80">
              {t('agentsCadres')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeBooth.agents?.length ? (
                activeBooth.agents.map((a: any) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-primary/10 text-primary border border-primary/20 max-w-full break-words whitespace-normal text-left"
                  >
                    {a.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic bg-muted px-3 py-1 rounded-md">
                  No agents assigned
                </span>
              )}
            </div>
          </div>

          {/* Demographics */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground/80">
              {t('demographics')}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-3 text-center transition-all hover:scale-105">
                <div className="text-xs text-muted-foreground mb-1 font-medium">
                  {t('male')}
                </div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
                  {activeBooth.maleCount || 0}
                </div>
              </div>
              <div className="bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900 rounded-lg p-3 text-center transition-all hover:scale-105">
                <div className="text-xs text-muted-foreground mb-1 font-medium">
                  {t('female')}
                </div>
                <div className="text-xl font-bold text-pink-700 dark:text-pink-400">
                  {activeBooth.femaleCount || 0}
                </div>
              </div>
              <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-lg p-3 text-center transition-all hover:scale-105">
                <div className="text-xs text-muted-foreground mb-1 font-medium">
                  {t('thirdGender')}
                </div>
                <div className="text-xl font-bold text-purple-700 dark:text-purple-400">
                  {activeBooth.thirdGenderCount || 0}
                </div>
              </div>
              <div className="bg-muted/50 border rounded-lg p-3 text-center transition-all hover:scale-105">
                <div className="text-xs text-muted-foreground mb-1 font-medium">
                  {t('total')}
                </div>
                <div className="text-xl font-bold text-foreground">
                  {activeBooth.totalCount || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Past Election Results in View Dialog */}
          {activeBooth.electionResults && activeBooth.electionResults.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground/80 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{t('pastElectionResults')}</span>
              </h4>
              <div className="space-y-2">
                {activeBooth.electionResults.map((res: any) => (
                  <div
                    key={res.id}
                    className="p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold">{res.electionName}</span>
                      <span className="text-muted-foreground block text-[11px]">
                        Total: {res.totalVotesPolled?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-[#8F0A1B] text-sm">
                        {res.tvkVotes?.toLocaleString()}
                      </span>
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFC72C] text-black">
                        {res.tvkPercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 mt-2 border-t border-border/50">
          <Button variant="outline" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </DialogContent>
      )}
    </Dialog>
  );
}
