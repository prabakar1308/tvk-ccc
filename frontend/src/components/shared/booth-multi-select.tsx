import React from 'react';
import { MultiSelectDropdown } from '@/components/ui/multi-select';
import { useBooths } from '@/hooks/use-booths';
import { Booth } from '@/services/api/booths';

export interface BoothMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  displayStyle?: 'badges' | 'comma-separated';
  disabled?: boolean;
}

export function BoothMultiSelect({
  value,
  onChange,
  displayStyle = 'comma-separated',
  disabled = false,
}: BoothMultiSelectProps) {
  const { data: booths = [], isLoading } = useBooths();

  return (
    <MultiSelectDropdown
      options={booths}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? "Loading..." : "Select Booths..."}
      searchPlaceholder="Search booths..."
      emptyMessage="No booth found."
      getOptionValue={(booth: Booth) => booth.boothNo}
      getOptionLabel={(booth: Booth) => booth.boothNo + (booth.name ? ` - ${booth.name}` : '')}
      getOptionBadgeLabel={(booth: Booth) => booth.boothNo + (booth.area ? ` - ${booth.area}` : '')}
      displayStyle={displayStyle}
      disabled={disabled || isLoading}
    />
  );
}
