import React from 'react';
import { MultiSelectDropdown } from '@/components/ui/multi-select';
import { useBoothAreas } from '@/hooks/use-booths';

export interface AreaMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  displayStyle?: 'badges' | 'comma-separated';
  disabled?: boolean;
}

export function AreaMultiSelect({
  value,
  onChange,
  displayStyle = 'comma-separated',
  disabled = false,
}: AreaMultiSelectProps) {
  const { data: areas = [], isLoading } = useBoothAreas();

  return (
    <MultiSelectDropdown
      options={areas}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? "Loading..." : "Select Areas..."}
      searchPlaceholder="Search areas..."
      emptyMessage="No area found."
      getOptionValue={(area: string) => area}
      getOptionLabel={(area: string) => area}
      displayStyle={displayStyle}
      disabled={disabled || isLoading}
      creatable={true}
    />
  );
}
