import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface MultiSelectDropdownProps {
  options: any[];
  value: string[];
  onChange: (value: string[]) => void;
  
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  
  getOptionValue: (option: any) => string;
  getOptionLabel: (option: any) => string;
  getOptionBadgeLabel?: (option: any) => string;
  
  displayStyle?: 'badges' | 'comma-separated';
  disabled?: boolean;
  creatable?: boolean;
}

export function MultiSelectDropdown({
  options,
  value = [],
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  getOptionValue,
  getOptionLabel,
  getOptionBadgeLabel,
  displayStyle = 'comma-separated',
  disabled = false,
  creatable = false,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const handleSelect = (currentValue: string) => {
    const isSelected = value.includes(currentValue);
    if (isSelected) {
      onChange(value.filter((v) => v !== currentValue));
    } else {
      onChange([...value, currentValue]);
    }
  };

  const clearSelection = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange([]);
  };

  const removeSingleSelection = (e: React.MouseEvent, itemValue: string) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(value.filter((v) => v !== itemValue));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
        render={
          <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open} 
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal h-auto min-h-[40px] py-2 flex items-center",
              value.length === 0 && "text-muted-foreground"
            )} 
          />
        }
      >
        <div className="flex-1 flex flex-wrap gap-1 py-0.5 items-center max-w-[calc(100%-2rem)] text-left">
          {value.length > 0 ? (
            displayStyle === 'badges' ? (
              value.map((val) => {
                const opt = options.find((o) => getOptionValue(o) === val);
                const badgeText = opt ? (getOptionBadgeLabel ? getOptionBadgeLabel(opt) : getOptionLabel(opt)) : val;
                return (
                  <span 
                    key={val} 
                    className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                    onClick={(e) => removeSingleSelection(e, val)}
                  >
                    {badgeText}
                    <X className="h-3 w-3 hover:text-destructive cursor-pointer shrink-0" />
                  </span>
                );
              })
            ) : (
              <span className="block truncate w-full pr-2">
                {value.map(val => {
                   const opt = options.find((o) => getOptionValue(o) === val);
                   return opt ? getOptionLabel(opt) : val;
                }).join(', ')}
              </span>
            )
          ) : (
            placeholder
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {value.length > 0 && (
            <div 
              role="button"
              tabIndex={0}
              className="p-0.5 rounded-sm hover:bg-muted/50 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </div>
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {creatable && search.trim().length > 2 ? (
                <div 
                  className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    handleSelect(search.trim());
                    setSearch("");
                    setOpen(false); // Optional: close on create, or just add it
                  }}
                >
                  <span className="text-muted-foreground mr-2">Create:</span> "{search}"
                </div>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const optionValue = getOptionValue(option);
                const isSelected = value.includes(optionValue);
                return (
                  <CommandItem
                    key={optionValue}
                    value={optionValue}
                    onSelect={() => handleSelect(optionValue)}
                  >
                    <Check 
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )} 
                    />
                    {getOptionLabel(option)}
                  </CommandItem>
                );
              })}
              {creatable && search.trim().length > 2 && !options.some(opt => getOptionLabel(opt).toLowerCase() === search.trim().toLowerCase() || getOptionValue(opt).toLowerCase() === search.trim().toLowerCase()) && (
                <CommandItem
                  value={search.trim()}
                  onSelect={(currentValue) => {
                    handleSelect(search.trim());
                    setSearch("");
                  }}
                >
                  <span className="text-muted-foreground mr-2">Create:</span> "{search.trim()}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
