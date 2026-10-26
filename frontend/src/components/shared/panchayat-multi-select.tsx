'use client';

import React from 'react';
import { MultiSelectDropdown } from '@/components/ui/multi-select';
import { useMasterAreas } from '@/hooks/use-unions';
import { useLocale } from 'next-intl';

export interface PanchayatMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  displayStyle?: 'badges' | 'comma-separated';
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function PanchayatMultiSelect({
  value,
  onChange,
  displayStyle = 'badges',
  disabled = false,
  placeholder,
  searchPlaceholder,
  emptyMessage,
}: PanchayatMultiSelectProps) {
  const locale = useLocale();
  const { data: masterAreas = [], isLoading } = useMasterAreas();

  return (
    <MultiSelectDropdown
      options={masterAreas}
      value={value}
      onChange={onChange}
      placeholder={
        placeholder ||
        (isLoading
          ? (locale === 'ta' ? 'ஏற்றுகிறது...' : 'Loading...')
          : (locale === 'ta' ? 'ஊராட்சிகளைத் தேர்ந்தெடுக்கவும்...' : 'Select Panchayats...'))
      }
      searchPlaceholder={
        searchPlaceholder || (locale === 'ta' ? 'ஊராட்சிகளைத் தேடவும்...' : 'Search panchayats...')
      }
      emptyMessage={
        emptyMessage || (locale === 'ta' ? 'ஊராட்சி எதுவும் கிடைக்கவில்லை.' : 'No panchayat found.')
      }
      getOptionValue={(item: { name: string; nameTa: string } | string) =>
        typeof item === 'string' ? item : item.name
      }
      getOptionLabel={(item: { name: string; nameTa: string } | string) => {
        if (typeof item === 'string') return item;
        return item.nameTa ? `${item.name} (${item.nameTa})` : item.name;
      }}
      getOptionBadgeLabel={(item: { name: string; nameTa: string } | string) => {
        if (typeof item === 'string') return item;
        return locale === 'ta' && item.nameTa ? item.nameTa : item.name;
      }}
      displayStyle={displayStyle}
      disabled={disabled || isLoading}
      creatable={true}
    />
  );
}
