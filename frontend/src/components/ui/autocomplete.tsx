import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Check } from 'lucide-react';

export interface AutocompleteProps<T> {
  value?: T | null;
  onChange: (value: T | null) => void;
  fetchOptions: (search: string) => Promise<T[]>;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string | number;
  placeholder?: string;
  debounceTime?: number;
  minChars?: number;
  className?: string;
}

export function Autocomplete<T>({
  value,
  onChange,
  fetchOptions,
  getOptionLabel,
  getOptionValue,
  placeholder = 'Search...',
  debounceTime = 300,
  minChars = 3,
  className = '',
}: AutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term to selected value if closing
        if (value) {
          setSearchTerm(getOptionLabel(value));
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [value, getOptionLabel]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= minChars && isOpen) {
        setIsLoading(true);
        try {
          const results = await fetchOptions(searchTerm);
          setOptions(results);
        } catch (error) {
          console.error('Error fetching options:', error);
          setOptions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setOptions([]);
      }
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [searchTerm, minChars, debounceTime, fetchOptions, isOpen]);

  const handleSelect = (option: T) => {
    onChange(option);
    setSearchTerm(getOptionLabel(option));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
    setOptions([]);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
          value={(!isOpen && value) ? getOptionLabel(value) : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange(null);
            }
          }}
          onClick={() => setIsOpen(true)}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && searchTerm.length >= minChars && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            options.map((option, index) => {
              const isSelected = value ? getOptionValue(value) === getOptionValue(option) : false;
              return (
                <div
                  key={`${getOptionValue(option)}-${index}`}
                  className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isSelected ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  <div className="mr-2 flex h-4 w-4 items-center justify-center">
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>
                  {getOptionLabel(option)}
                </div>
              );
            })
          )}
        </div>
      )}
      
      {isOpen && searchTerm.length > 0 && searchTerm.length < minChars && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover py-3 text-center text-sm text-muted-foreground shadow-md">
          Please enter at least {minChars} characters to search
        </div>
      )}
    </div>
  );
}

export interface MultiAutocompleteProps<T> {
  value: T[];
  onChange: (value: T[]) => void;
  fetchOptions: (search: string) => Promise<T[]>;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string | number;
  placeholder?: string;
  debounceTime?: number;
  minChars?: number;
  className?: string;
}

export function MultiAutocomplete<T>({
  value,
  onChange,
  fetchOptions,
  getOptionLabel,
  getOptionValue,
  placeholder = 'Search...',
  debounceTime = 300,
  minChars = 3,
  className = '',
}: MultiAutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= minChars && isOpen) {
        setIsLoading(true);
        try {
          const results = await fetchOptions(searchTerm);
          setOptions(results);
        } catch (error) {
          console.error('Error fetching options:', error);
          setOptions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setOptions([]);
      }
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [searchTerm, minChars, debounceTime, fetchOptions, isOpen]);

  const handleSelect = (option: T) => {
    const optionValue = getOptionValue(option);
    const isSelected = value.some(v => getOptionValue(v) === optionValue);
    
    if (isSelected) {
      onChange(value.filter(v => getOptionValue(v) !== optionValue));
    } else {
      onChange([...value, option]);
    }
    setSearchTerm('');
    // Optionally keep open to allow multiple selections
    // setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (e: React.MouseEvent, optionToRemove: T) => {
    e.stopPropagation();
    onChange(value.filter(v => getOptionValue(v) !== getOptionValue(optionToRemove)));
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div 
        className="relative flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search className="h-4 w-4 text-muted-foreground ml-1 shrink-0" />
        
        {value.map((item, idx) => (
          <span 
            key={`${getOptionValue(item)}-${idx}`} 
            className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {getOptionLabel(item)}
            <button
              type="button"
              onClick={(e) => handleRemove(e, item)}
              className="rounded-full p-0.5 hover:bg-primary/20 focus:bg-primary/20 focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[120px] bg-transparent py-0.5 outline-none placeholder:text-muted-foreground"
          placeholder={value.length === 0 ? placeholder : ''}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
        />
      </div>

      {isOpen && searchTerm.length >= minChars && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            options.map((option, index) => {
              const isSelected = value.some(v => getOptionValue(v) === getOptionValue(option));
              return (
                <div
                  key={`${getOptionValue(option)}-${index}`}
                  className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isSelected ? 'bg-accent/50' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option);
                  }}
                >
                  <div className="mr-2 flex h-4 w-4 items-center justify-center">
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>
                  {getOptionLabel(option)}
                </div>
              );
            })
          )}
        </div>
      )}
      
      {isOpen && searchTerm.length > 0 && searchTerm.length < minChars && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover py-3 text-center text-sm text-muted-foreground shadow-md">
          Please enter at least {minChars} characters to search
        </div>
      )}
    </div>
  );
}

