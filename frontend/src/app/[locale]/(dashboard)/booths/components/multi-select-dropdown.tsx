'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface MultiSelectDropdownProps {
  options: any[];
  selected: string[];
  onChange: (val: string[]) => void;
  placeholder: string;
  labelKey?: string;
  valueKey?: string;
}

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
  labelKey = 'name',
  valueKey = 'id',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((item) => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const removeOption = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== val));
  };

  const selectedItems = options.filter((opt) => selected.includes(opt[valueKey]));

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className="min-h-10 flex w-full flex-wrap items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-1.5 pr-2 pl-2.5 text-sm transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-primary/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedItems.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedItems.map((item) => (
              <span
                key={item[valueKey]}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
              >
                {item[labelKey]}
                <button
                  type="button"
                  onClick={(e) => removeOption(e, item[valueKey])}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          {options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = selected.includes(option[valueKey]);
              return (
                <div
                  key={option[valueKey]}
                  className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  onClick={() => toggleOption(option[valueKey])}
                >
                  <div
                    className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  {option[labelKey]}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

