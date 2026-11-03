'use client';

import React from 'react';
import { MultiSelectDropdown } from '@/components/ui/multi-select';
import { useVillages, useCreateVillage } from '@/hooks/use-villages';
import { useLocale } from 'next-intl';

export interface VillageMultiSelectProps {
  panchayatId?: string;
  value: string[];
  onChange: (names: string[], ids: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function VillageMultiSelect({
  panchayatId,
  value = [],
  onChange,
  disabled = false,
  placeholder,
  searchPlaceholder,
  emptyMessage,
}: VillageMultiSelectProps) {
  const locale = useLocale();
  const { data: villages = [], isLoading } = useVillages(panchayatId || undefined);
  const createVillage = useCreateVillage();

  const handleNamesChange = async (newValues: string[]) => {
    const nameToId = new Map<string, string>();
    villages.forEach((v) => {
      if (v.name) nameToId.set(v.name.trim().toLowerCase(), v.id);
      if (v.nameTa) nameToId.set(v.nameTa.trim().toLowerCase(), v.id);
      if (v.id) nameToId.set(v.id.toLowerCase(), v.id);
    });

    const matchedIds: string[] = [];

    for (const val of newValues) {
      const trimmed = val.trim();
      const lower = trimmed.toLowerCase();
      const existingId = nameToId.get(lower);

      if (existingId) {
        matchedIds.push(existingId);
      } else if (panchayatId) {
        try {
          const created = await createVillage.mutateAsync({
            name: trimmed,
            nameTa: trimmed,
            panchayatId,
          });
          if (created && created.id) {
            matchedIds.push(created.id);
            nameToId.set(lower, created.id);
          }
        } catch (err) {
          console.error('Failed to auto-create village:', err);
        }
      }
    }

    onChange(newValues, matchedIds);
  };

  return (
    <MultiSelectDropdown
      options={villages}
      value={value}
      onChange={handleNamesChange}
      placeholder={
        placeholder ||
        (!panchayatId
          ? (locale === 'ta' ? 'முதலில் ஊராட்சியைத் தேர்ந்தெடுக்கவும்' : 'Select a Panchayat first')
          : isLoading
          ? (locale === 'ta' ? 'ஏற்றுகிறது...' : 'Loading...')
          : (locale === 'ta' ? 'கிராமங்களைத் தேர்ந்தெடுக்கவும் / சேர்க்கவும்...' : 'Select or add villages...'))
      }
      searchPlaceholder={
        searchPlaceholder ||
        (locale === 'ta'
          ? 'கிராமத்தைத் தேடவும் அல்லது தட்டச்சு செய்து சேர்க்கவும்...'
          : 'Search or type to add custom village...')
      }
      emptyMessage={
        emptyMessage ||
        (locale === 'ta' ? 'கிராமங்கள் எதுவும் இல்லை.' : 'No villages found.')
      }
      createLabel={locale === 'ta' ? 'சேர்:' : 'Create:'}
      getOptionValue={(v: any) => (typeof v === 'string' ? v : v.name)}
      getOptionLabel={(v: any) => {
        if (typeof v === 'string') return v;
        return locale === 'ta' && v.nameTa
          ? `${v.nameTa} (${v.name})`
          : (v.nameTa ? `${v.name} (${v.nameTa})` : v.name);
      }}
      getOptionBadgeLabel={(v: any) => {
        if (typeof v === 'string') return v;
        return locale === 'ta' && v.nameTa ? v.nameTa : v.name;
      }}
      displayStyle="badges"
      disabled={disabled || !panchayatId}
      creatable={true}
    />
  );
}
