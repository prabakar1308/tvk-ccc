'use client';

import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Vote } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Election } from '@/services/api/elections';
import { useElections } from '@/hooks/use-elections';
import { cn } from '@/lib/utils';

export interface ElectionSelectProps {
  /** The selected election id or year */
  value?: string;
  /** Callback when selection value changes */
  onValueChange?: (value: string) => void;
  /** Callback with the selected Election entity (or null if custom/none) */
  onSelectElection?: (election: Election | null) => void;
  /** Optional master election list; if omitted, fetched automatically via useElections() */
  elections?: Election[];
  /** Mode for the select item value: 'id' (default) or 'year' */
  valueMode?: 'id' | 'year';
  /** Whether to show an "Other / Custom" item */
  allowCustom?: boolean;
  /** Custom item value (default 'Other') */
  customValue?: string;
  /** Custom item label */
  customLabel?: string;
  /** Whether to show the Active election badge (★ Active) */
  showActiveBadge?: boolean;
  /** Whether to show the Vote icon in the trigger */
  showIcon?: boolean;
  /** Trigger size: 'sm' (h-8) or 'default' (h-10) */
  size?: 'sm' | 'default';
  /** Trigger placeholder */
  placeholder?: string;
  /** Trigger className */
  className?: string;
  /** SelectContent className */
  contentClassName?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Auto-select the active / current election if value is empty */
  autoSelectActive?: boolean;
}

export function ElectionSelect({
  value,
  onValueChange,
  onSelectElection,
  elections: propElections,
  valueMode = 'id',
  allowCustom = false,
  customValue = 'Other',
  customLabel,
  showActiveBadge = true,
  showIcon = true,
  size = 'default',
  placeholder,
  className,
  contentClassName,
  disabled = false,
  autoSelectActive = false,
}: ElectionSelectProps) {
  const locale = useLocale();

  // If elections are not passed via props, query master data
  const { data: queriedElections = [], isLoading } = useElections();
  const masterElections: Election[] = propElections ?? queriedElections;

  // Sort elections: Active first, then by year descending
  const sortedElections = useMemo(() => {
    return [...masterElections].sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return (Number(b.year) || 0) - (Number(a.year) || 0);
    });
  }, [masterElections]);

  // Find the selected election entity based on current value and valueMode
  const selectedElection = useMemo(() => {
    if (!value) return null;
    if (value === customValue) return null;

    if (valueMode === 'year') {
      return sortedElections.find((e) => e.year === value) || null;
    }
    // Default valueMode === 'id', with fallback matching by year if someone passed year
    return (
      sortedElections.find((e) => e.id === value) ||
      sortedElections.find((e) => e.year === value) ||
      null
    );
  }, [value, valueMode, customValue, sortedElections]);

  // Auto-select active election if required and value is empty
  React.useEffect(() => {
    if (autoSelectActive && !value && sortedElections.length > 0) {
      const active = sortedElections.find((e) => e.isCurrent) || sortedElections[0];
      if (active) {
        const valToSet = valueMode === 'year' ? active.year : active.id;
        onValueChange?.(valToSet);
        onSelectElection?.(active);
      }
    }
  }, [autoSelectActive, value, sortedElections, valueMode, onValueChange, onSelectElection]);

  const defaultPlaceholder =
    placeholder ||
    (locale === 'ta' ? 'தேர்தலைத் தேர்ந்தெடுக்கவும்' : 'Select Election');

  const defaultCustomLabel =
    customLabel ||
    (locale === 'ta' ? 'பிற / தனிப்பயன் தேர்தல்' : 'Other / Custom Election');

  // Handle value change
  const handleValueChange = (newVal: string | null) => {
    if (!newVal) return;

    if (newVal === customValue) {
      onValueChange?.(newVal);
      onSelectElection?.(null);
      return;
    }

    const matched =
      valueMode === 'year'
        ? sortedElections.find((e) => e.year === newVal)
        : sortedElections.find((e) => e.id === newVal) ||
          sortedElections.find((e) => e.year === newVal);

    onValueChange?.(newVal);
    onSelectElection?.(matched || null);
  };

  // Determine trigger display label
  const triggerLabel = useMemo(() => {
    if (value === customValue) {
      return defaultCustomLabel;
    }
    if (selectedElection) {
      const name =
        locale === 'ta' && selectedElection.nameTa
          ? selectedElection.nameTa
          : selectedElection.name;
      return `${selectedElection.year} - ${name}`;
    }
    return undefined;
  }, [value, customValue, defaultCustomLabel, selectedElection, locale]);

  // If value was passed as a year but valueMode is 'id'
  const resolvedValue = useMemo(() => {
    if (!value) return '';
    if (value === customValue) return customValue;
    if (valueMode === 'id') {
      const found = sortedElections.find((e) => e.id === value || e.year === value);
      return found ? found.id : value;
    }
    return value;
  }, [value, customValue, valueMode, sortedElections]);

  return (
    <Select
      value={resolvedValue}
      onValueChange={handleValueChange}
      disabled={disabled || (isLoading && masterElections.length === 0)}
    >
      <SelectTrigger
        className={cn(
          size === 'sm'
            ? 'h-8 text-xs font-bold rounded-xl'
            : 'h-10 text-xs sm:text-sm font-medium rounded-xl',
          'cursor-pointer transition-colors',
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {showIcon && <Vote className="w-3.5 h-3.5 text-primary shrink-0" />}
          <SelectValue placeholder={defaultPlaceholder}>
            {triggerLabel}
          </SelectValue>
        </div>
      </SelectTrigger>

      <SelectContent
        className={cn(
          '!w-auto !min-w-[max-content] max-w-[90vw] sm:max-w-[550px] rounded-xl p-1 shadow-lg',
          contentClassName
        )}
        align="start"
      >
        {sortedElections.map((elec) => {
          const itemVal = valueMode === 'year' ? elec.year : elec.id;
          const displayName =
            locale === 'ta' && elec.nameTa ? elec.nameTa : elec.name;
          const fullLabel = `${elec.year} - ${displayName}`;

          return (
            <SelectItem
              key={elec.id}
              value={itemVal}
              label={fullLabel}
              className="text-xs font-medium py-2 px-3 rounded-lg whitespace-nowrap cursor-pointer hover:bg-primary/10 transition-colors"
            >
              <span className="font-mono font-bold text-primary mr-1.5">
                {elec.year}
              </span>
              <span>- {displayName}</span>
              {showActiveBadge && elec.isCurrent && (
                <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded bg-[#FFC72C] text-[#8F0A1B] shadow-2xs shrink-0">
                  ★ Active
                </span>
              )}
            </SelectItem>
          );
        })}

        {allowCustom && (
          <SelectItem
            value={customValue}
            label={defaultCustomLabel}
            className="text-xs font-medium py-2 px-3 rounded-lg text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted transition-colors border-t border-border/50 mt-1"
          >
            {defaultCustomLabel}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

