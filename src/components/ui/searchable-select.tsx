'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  keywords?: string;
}

interface SearchableSelectProps {
  value?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: SearchableSelectOption[];
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  placeholder = 'Selectează...',
  searchPlaceholder = 'Caută...',
  emptyText = 'Niciun rezultat.',
  options,
  onValueChange,
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.keywords ?? ''}`.trim()}
                  onSelect={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === opt.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SearchableSelect;
